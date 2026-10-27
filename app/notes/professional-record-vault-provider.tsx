"use client"

import { ChangeEvent, ReactNode, createContext, useCallback, useContext, useEffect, useRef, useState } from "react"
import { Download, FolderOpen, KeyRound, LockKeyhole, ShieldCheck, Trash2 } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { AppInset, AppNotice, AppPageShell, AppSurface, appCalloutClassName } from "@/components/ui/app-surface"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PUBLIC_PRODUCT_IDENTITY } from "@/lib/public-product-identity"
import {
  PROFESSIONAL_RECORD_VAULT_STORAGE_KEY,
  collectLegacyProfessionalRecordMigration,
  createEmptyProfessionalRecordVaultPayload,
  createEncryptedProfessionalRecordBundle,
  createEncryptedProfessionalRecordVault,
  decryptEncryptedProfessionalRecordBundle,
  decryptEncryptedProfessionalRecordVault,
  isEncryptedProfessionalRecordVault,
  mergeProfessionalRecordVaultPayloadChanges,
  normalizeProfessionalRecordVaultPayload,
  setProfessionalRecordVaultDraft,
  setProfessionalRecordVaultIntakeWorkspace,
} from "@/lib/professional-record-vault"

type AnyRecord = Record<string, any>
type VaultStatus = "loading" | "setup" | "locked" | "unlocked" | "corrupt"
type LegacyStatus = {
  legacyPlaintextFound: boolean
  encryptedIntakeVaultFound: boolean
  warnings: string[]
}

type ProfessionalRecordVaultContextValue = {
  status: VaultStatus
  payload: AnyRecord
  revision: number
  message: string | null
  legacyStatus: LegacyStatus
  setMessage: (message: string | null) => void
  createVault: (passphrase: string, confirmation: string) => Promise<boolean>
  unlockVault: (passphrase: string) => Promise<boolean>
  lockVault: () => void
  resetCorruptVault: () => void
  persistPayload: (nextPayload: AnyRecord, successMessage?: string, options?: { mergeCurrentStored?: boolean }) => Promise<AnyRecord | null>
  saveDraft: (recordType: "soap" | "journal" | "rom", draft: AnyRecord | null, successMessage?: string) => Promise<AnyRecord | null>
  saveIntakeWorkspace: (workspace: AnyRecord, successMessage?: string) => Promise<AnyRecord | null>
  exportEncryptedBundle: (password: string) => Promise<AnyRecord | null>
  importEncryptedBundle: (text: string, password: string) => Promise<AnyRecord | null>
}

const ProfessionalRecordVaultContext = createContext<ProfessionalRecordVaultContextValue | null>(null)

const emptyLegacyStatus: LegacyStatus = {
  legacyPlaintextFound: false,
  encryptedIntakeVaultFound: false,
  warnings: [],
}

type VaultOperation = { view: symbol | null; storage: symbol }
type PendingVaultWrite = { storage: symbol; settled: Promise<void> }

// These contain only transient authority/settlement metadata, never record data or keys.
// Storage authority outlives one provider mount so reset cannot be undone by its old save.
let vaultStorageGeneration = Symbol("professional-vault-storage")
const pendingVaultWrites = new Set<PendingVaultWrite>()

/** Register an accepted write so a later unlock reads its settled ciphertext. */
function beginVaultWrite(storage: symbol) {
  let settle!: () => void
  const pending = { storage, settled: new Promise<void>((resolve) => { settle = resolve }) }
  pendingVaultWrites.add(pending)
  return () => { pendingVaultWrites.delete(pending); settle() }
}

/** Wait only for already accepted writes to this generation, never a discarded vault. */
async function settleVaultWrites(storage: symbol) {
  await Promise.all([...pendingVaultWrites].filter((write) => write.storage === storage).map((write) => write.settled))
}

/** Own plaintext-view authority separately from accepted encrypted persistence. */
export function ProfessionalRecordVaultProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<VaultStatus>("loading")
  const [payload, setPayload] = useState<AnyRecord>(() => createEmptyProfessionalRecordVaultPayload())
  const [passphrase, setPassphrase] = useState("")
  const [message, setMessage] = useState<string | null>(null)
  const [legacyStatus, setLegacyStatus] = useState<LegacyStatus>(emptyLegacyStatus)
  const [vaultCreatedAt, setVaultCreatedAt] = useState("")
  const [revision, setRevision] = useState(0)
  // State binds callbacks to the rendered view without reading mutable refs during render.
  const [renderedOperation, setRenderedOperation] = useState<VaultOperation>(() => ({
    view: Symbol("professional-vault-view"), storage: vaultStorageGeneration,
  }))
  const viewAuthority = useRef<symbol | null>(renderedOperation.view)

  /** A closed view may finish ciphertext work, but cannot publish plaintext or messages. */
  const hasViewAuthority = (operation: VaultOperation) => operation.view !== null
    && operation.view === viewAuthority.current && operation.storage === vaultStorageGeneration

  /** Explicit reset/recreation revokes storage writes even across provider remounts. */
  const hasStorageAuthority = (operation: VaultOperation) => operation.storage === vaultStorageGeneration

  /** Supersede earlier view completions before starting an explicit create or unlock. */
  const claimView = (): VaultOperation => {
    const operation = { view: Symbol("professional-vault-view"), storage: vaultStorageGeneration }
    viewAuthority.current = operation.view
    setRenderedOperation(operation)
    return operation
  }

  const inspectStoredVault = useCallback(() => {
    const raw = window.localStorage.getItem(PROFESSIONAL_RECORD_VAULT_STORAGE_KEY)
    if (!raw) {
      const migration = collectLegacyProfessionalRecordMigration((key: string) => window.localStorage.getItem(key))
      setLegacyStatus({
        legacyPlaintextFound: migration.legacyPlaintextFound,
        encryptedIntakeVaultFound: migration.encryptedIntakeVaultFound,
        warnings: migration.warnings,
      })
      setStatus("setup")
      return
    }

    try {
      const parsed = JSON.parse(raw)
      if (!isEncryptedProfessionalRecordVault(parsed)) {
        setStatus("corrupt")
        setMessage(`${PUBLIC_PRODUCT_IDENTITY.name} could not read this browser's professional-record vault metadata.`)
        return
      }
      setVaultCreatedAt(typeof parsed.createdAt === "string" ? parsed.createdAt : "")
      setStatus("locked")
    } catch {
      setStatus("corrupt")
      setMessage(`${PUBLIC_PRODUCT_IDENTITY.name} could not parse this browser's professional-record vault.`)
    }
  }, [])

  useEffect(() => {
    const operation = { view: Symbol("professional-vault-view"), storage: vaultStorageGeneration }
    viewAuthority.current = operation.view
    setRenderedOperation(operation)
    setPayload(createEmptyProfessionalRecordVaultPayload())
    setPassphrase("")
    inspectStoredVault()
    return () => { viewAuthority.current = null }
  }, [inspectStoredVault])

  /** Carry an import's issued operation through persistence instead of reacquiring a view. */
  const persistPayload = async (
    nextPayload: AnyRecord,
    successMessage = "Professional-record vault saved in this browser.",
    options: { mergeCurrentStored?: boolean } = {},
    issuedOperation?: VaultOperation,
  ) => {
    const operation = issuedOperation ?? renderedOperation
    if (!hasStorageAuthority(operation) || (!issuedOperation && !hasViewAuthority(operation))) return null
    if (!passphrase) {
      if (hasViewAuthority(operation)) {
        setStatus("locked")
        setPayload(createEmptyProfessionalRecordVaultPayload())
        setMessage("Unlock the professional-record vault before saving clinical documents.")
      }
      return null
    }

    const finishWrite = beginVaultWrite(operation.storage)
    try {
      const normalized = normalizeProfessionalRecordVaultPayload(nextPayload)
      let payloadToSave = normalized
      let createdAt = vaultCreatedAt
      const raw = window.localStorage.getItem(PROFESSIONAL_RECORD_VAULT_STORAGE_KEY)
      if (raw && options.mergeCurrentStored !== false) {
        const parsed = JSON.parse(raw)
        if (!isEncryptedProfessionalRecordVault(parsed)) {
          throw new Error("This browser's professional-record vault needs attention before saving.")
        }
        const currentStoredPayload = await decryptEncryptedProfessionalRecordVault(parsed, passphrase)
        payloadToSave = mergeProfessionalRecordVaultPayloadChanges(payload, normalized, currentStoredPayload)
        createdAt = typeof parsed.createdAt === "string" ? parsed.createdAt : createdAt
      }
      if (!hasStorageAuthority(operation)) return null
      const vault = await createEncryptedProfessionalRecordVault(payloadToSave, passphrase, { createdAt })
      if (!hasStorageAuthority(operation)) return null
      window.localStorage.setItem(PROFESSIONAL_RECORD_VAULT_STORAGE_KEY, JSON.stringify(vault))
      // The encrypted write committed even if its original view has locked.
      // Report that accepted save without restoring plaintext in the closed view.
      if (!hasViewAuthority(operation)) return normalized
      setVaultCreatedAt(vault.createdAt)
      setPayload(payloadToSave)
      setRevision((current) => current + 1)
      setStatus("unlocked")
      setMessage(successMessage)
      return normalized
    } catch (error) {
      if (hasViewAuthority(operation)) setMessage(error instanceof Error ? error.message : "Could not save the professional-record vault.")
      return null
    } finally { finishWrite() }
  }

  /** Immediately revoke plaintext access while allowing accepted encrypted writes. */
  const lockVault = () => {
    if (viewAuthority.current === null) return
    claimView()
    setPayload(createEmptyProfessionalRecordVaultPayload())
    setPassphrase("")
    setStatus("locked")
    setRevision((current) => current + 1)
    setMessage("Professional-record vault locked.")
  }

  /** Replace storage authority; migrate legacy plaintext only after ciphertext commits. */
  const createVault = async (nextPassphrase: string, confirmation: string) => {
    if (!hasViewAuthority(renderedOperation)) return false
    const cleanPassphrase = nextPassphrase.trim()
    if (cleanPassphrase.length < 8) {
      setMessage("Professional-record vault passphrase must be at least 8 characters.")
      return false
    }
    if (cleanPassphrase !== confirmation.trim()) {
      setMessage("Passphrase confirmation does not match.")
      return false
    }

    vaultStorageGeneration = Symbol("professional-vault-storage")
    const operation = claimView()
    const finishWrite = beginVaultWrite(operation.storage)
    let ciphertextCommitted = false
    try {
      const migration = collectLegacyProfessionalRecordMigration((key: string) => window.localStorage.getItem(key))
      const vault = await createEncryptedProfessionalRecordVault(migration.payload, cleanPassphrase)
      if (!hasStorageAuthority(operation)) return false
      window.localStorage.setItem(PROFESSIONAL_RECORD_VAULT_STORAGE_KEY, JSON.stringify(vault))
      ciphertextCommitted = true
      for (const key of migration.plaintextKeysToRemove) {
        window.localStorage.removeItem(key)
      }
      if (!hasViewAuthority(operation)) return false
      setPayload(migration.payload)
      setPassphrase(cleanPassphrase)
      setVaultCreatedAt(vault.createdAt)
      setLegacyStatus({
        legacyPlaintextFound: false,
        encryptedIntakeVaultFound: migration.encryptedIntakeVaultFound,
        warnings: migration.warnings,
      })
      setStatus("unlocked")
      setRevision((current) => current + 1)
      setMessage(
        migration.legacyPlaintextFound
          ? "Legacy plaintext drafts were encrypted into the professional-record vault."
          : "Professional-record vault created and unlocked for this browser session.",
      )
      return true
    } catch (error) {
      if (hasViewAuthority(operation)) {
        if (ciphertextCommitted) {
          // Setup retry would replace committed drafts with only the plaintext left after partial cleanup.
          lockVault()
          setMessage("Encrypted vault saved, but legacy plaintext cleanup is incomplete. Unlock the vault to recover your drafts.")
        } else {
          setMessage(error instanceof Error ? error.message : "Could not create the professional-record vault.")
        }
      }
      return false
    } finally { finishWrite() }
  }

  /** Open only the current view, after accepted writes have settled for this vault. */
  const unlockVault = async (nextPassphrase: string) => {
    if (!hasViewAuthority(renderedOperation)) return false
    const cleanPassphrase = nextPassphrase.trim()
    if (cleanPassphrase.length < 8) {
      setMessage("Enter the professional-record vault passphrase.")
      return false
    }
    const operation = claimView()
    try {
      await settleVaultWrites(operation.storage)
      if (!hasViewAuthority(operation)) return false
      const raw = window.localStorage.getItem(PROFESSIONAL_RECORD_VAULT_STORAGE_KEY)
      const parsed = raw ? JSON.parse(raw) : null
      if (!isEncryptedProfessionalRecordVault(parsed)) {
        setStatus(raw ? "corrupt" : "setup")
        setMessage(raw ? "This browser's professional-record vault needs attention." : "Create a professional-record vault before continuing.")
        return false
      }
      const unlockedPayload = await decryptEncryptedProfessionalRecordVault(parsed, cleanPassphrase)
      if (!hasViewAuthority(operation)) return false
      setPayload(unlockedPayload)
      setPassphrase(cleanPassphrase)
      setVaultCreatedAt(typeof parsed.createdAt === "string" ? parsed.createdAt : "")
      setStatus("unlocked")
      setRevision((current) => current + 1)
      setMessage("Professional-record vault unlocked for this browser session.")
      return true
    } catch (error) {
      if (hasViewAuthority(operation)) setMessage(error instanceof Error ? error.message : "Could not unlock the professional-record vault.")
      return false
    }
  }

  /** Discard unreadable storage and revoke every older writer before removal. */
  const resetCorruptVault = () => {
    if (!hasViewAuthority(renderedOperation)) return
    vaultStorageGeneration = Symbol("professional-vault-storage")
    claimView()
    window.localStorage.removeItem(PROFESSIONAL_RECORD_VAULT_STORAGE_KEY)
    setPayload(createEmptyProfessionalRecordVaultPayload())
    setPassphrase("")
    setVaultCreatedAt("")
    setRevision((current) => current + 1)
    setMessage("Unreadable professional-record vault data removed from this browser.")
    inspectStoredVault()
  }

  const saveDraft = async (recordType: "soap" | "journal" | "rom", draft: AnyRecord | null, successMessage?: string) => {
    return persistPayload(
      setProfessionalRecordVaultDraft(payload, recordType, draft),
      successMessage ?? "Draft saved in the encrypted professional-record vault.",
    )
  }

  const saveIntakeWorkspace = async (workspace: AnyRecord, successMessage?: string) => {
    return persistPayload(
      setProfessionalRecordVaultIntakeWorkspace(payload, workspace),
      successMessage ?? "Intake workspace saved in the encrypted professional-record vault.",
    )
  }

  /** Finish an accepted encrypted export without granting a closed view new authority. */
  const exportEncryptedBundle = async (password: string) => {
    const operation = renderedOperation
    if (!hasViewAuthority(operation)) return null
    try {
      const bundle = await createEncryptedProfessionalRecordBundle(payload, password)
      if (hasViewAuthority(operation)) setMessage("Encrypted professional-record bundle created. Keep the password separate from the file.")
      return bundle
    } catch (error) {
      if (hasViewAuthority(operation)) setMessage(error instanceof Error ? error.message : "Could not create the encrypted professional-record bundle.")
      return null
    }
  }

  /** Preserve the accepting view through decrypt and persistence, including a later Lock. */
  const importEncryptedBundle = async (text: string, password: string) => {
    const operation = renderedOperation
    if (!hasViewAuthority(operation)) return null
    if (!passphrase) {
      setStatus("locked")
      setMessage("Unlock the professional-record vault before importing a bundle.")
      return null
    }
    const finishWrite = beginVaultWrite(operation.storage)
    try {
      const bundle = JSON.parse(text)
      const importedPayload = await decryptEncryptedProfessionalRecordBundle(bundle, password)
      return await persistPayload(importedPayload, "Encrypted professional-record bundle imported into this browser vault.", { mergeCurrentStored: false }, operation)
    } catch (error) {
      if (hasViewAuthority(operation)) setMessage(error instanceof Error ? error.message : "Could not import that encrypted professional-record bundle.")
      return null
    } finally { finishWrite() }
  }

  const value: ProfessionalRecordVaultContextValue = {
    status,
    payload,
    revision,
    message,
    legacyStatus,
    setMessage: (nextMessage) => { if (hasViewAuthority(renderedOperation)) setMessage(nextMessage) },
    createVault,
    unlockVault,
    lockVault,
    resetCorruptVault,
    persistPayload,
    saveDraft,
    saveIntakeWorkspace,
    exportEncryptedBundle,
    importEncryptedBundle,
  }

  return (
    <ProfessionalRecordVaultContext.Provider value={value}>
      {children}
    </ProfessionalRecordVaultContext.Provider>
  )
}

export function useProfessionalRecordVault() {
  const context = useContext(ProfessionalRecordVaultContext)
  if (!context) {
    throw new Error("useProfessionalRecordVault must be used inside ProfessionalRecordVaultProvider")
  }
  return context
}

export function ProfessionalRecordVaultGate({ children }: { children: ReactNode }) {
  const vault = useProfessionalRecordVault()
  const [password, setPassword] = useState("")
  const [confirmation, setConfirmation] = useState("")

  if (vault.status === "unlocked") {
    return <>{children}</>
  }

  const isSetup = vault.status === "setup"
  const isLocked = vault.status === "locked"
  const isCorrupt = vault.status === "corrupt"
  const isLoading = vault.status === "loading"

  const submitCreate = async () => {
    const created = await vault.createVault(password, confirmation)
    if (created) {
      setPassword("")
      setConfirmation("")
    }
  }

  const submitUnlock = async () => {
    const unlocked = await vault.unlockVault(password)
    if (unlocked) {
      setPassword("")
      setConfirmation("")
    }
  }

  return (
    <AppPageShell title="Professional-Record Vault" width="prose">
      <AppSurface
        title={isSetup ? "Create encrypted professional-record vault" : isCorrupt ? "Professional-record vault needs attention" : "Unlock professional-record vault"}
        description={
          isSetup
            ? "Create an offline passphrase before making or viewing therapist documentation in this browser."
            : isCorrupt
              ? `${PUBLIC_PRODUCT_IDENTITY.name} could not read this browser's professional-record vault data.`
              : "Enter the passphrase to unlock local therapist documentation for this browser session."
        }
        icon={<ShieldCheck className="h-5 w-5" aria-hidden="true" />}
        className={appCalloutClassName}
      >
        {isLoading ? <p className="text-sm text-muted-foreground">Checking this browser&apos;s professional-record vault...</p> : null}

        {isSetup && vault.legacyStatus.legacyPlaintextFound ? (
          <AppNotice
            tone="accent"
            title="Legacy local drafts found"
            description="Creating the vault will encrypt existing plaintext SOAP, intake, journal, and ROM drafts into the global professional-record vault, then remove the imported plaintext keys."
          />
        ) : null}

        {vault.legacyStatus.warnings.length > 0 ? (
          <AppInset className="grid gap-2 p-4 text-sm text-muted-foreground">
            {vault.legacyStatus.warnings.map((warning) => <p key={warning}>{warning}</p>)}
          </AppInset>
        ) : null}

        {isLocked ? (
          <div className="grid gap-3">
            <div className="space-y-2">
              <Label htmlFor="professionalRecordVaultPassword">Vault passphrase</Label>
              <Input
                id="professionalRecordVaultPassword"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
              />
            </div>
            <Button type="button" onClick={submitUnlock} className="justify-self-start bg-primary hover:bg-brand-orange-glow">
              <KeyRound className="mr-2 h-4 w-4" />
              Unlock vault
            </Button>
          </div>
        ) : null}

        {isSetup ? (
          <div className="grid gap-3">
            <div className="space-y-2">
              <Label htmlFor="newProfessionalRecordVaultPassword">New vault passphrase</Label>
              <Input
                id="newProfessionalRecordVaultPassword"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmProfessionalRecordVaultPassword">Confirm passphrase</Label>
              <Input
                id="confirmProfessionalRecordVaultPassword"
                type="password"
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                autoComplete="new-password"
              />
            </div>
            <Button type="button" onClick={submitCreate} className="justify-self-start bg-primary hover:bg-brand-orange-glow">
              <KeyRound className="mr-2 h-4 w-4" />
              Create encrypted vault
            </Button>
          </div>
        ) : null}

        {isCorrupt ? (
          <AppInset className="grid gap-3 p-4">
            <p className="text-sm text-muted-foreground">
              Resetting removes only the unreadable global vault entry. Legacy route-specific drafts are not removed by this action.
            </p>
            <Button type="button" variant="outline" onClick={vault.resetCorruptVault} className="justify-self-start">
              <Trash2 className="mr-2 h-4 w-4" />
              Reset local vault
            </Button>
          </AppInset>
        ) : null}

        {vault.message ? <p className="text-sm text-brand-orange">{vault.message}</p> : null}
      </AppSurface>
    </AppPageShell>
  )
}

export function ProfessionalRecordVaultToolbar({ className }: { className?: string }) {
  const vault = useProfessionalRecordVault()

  return (
    <div className={className}>
      <Button type="button" variant="outline" onClick={vault.lockVault}>
        <LockKeyhole className="mr-2 h-4 w-4" />
        Lock vault
      </Button>
    </div>
  )
}

/** Constrain transfer tracks and labels to narrow cards without clipping the encrypted-backup controls. */
export function ProfessionalRecordVaultTransferControls({ idPrefix = "professionalRecordVault" }: { idPrefix?: string }) {
  const vault = useProfessionalRecordVault()
  const [exportPassword, setExportPassword] = useState("")
  const [importPassword, setImportPassword] = useState("")
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const exportBundle = async () => {
    const bundle = await vault.exportEncryptedBundle(exportPassword)
    if (!bundle) return

    downloadFile(
      "massagelab-professional-record-vault.mlab",
      JSON.stringify(bundle, null, 2),
      "application/vnd.massagelab.encrypted+json",
    )
    setExportPassword("")
  }

  const importBundle = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    await vault.importEncryptedBundle(await file.text(), importPassword)
    setImportPassword("")
    event.target.value = ""
  }

  return (
    <AppInset className="grid grid-cols-1 gap-4 p-4 lg:grid-cols-2">
      <div className="grid gap-3">
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}ExportPassword`}>Encrypted bundle password</Label>
          <Input
            id={`${idPrefix}ExportPassword`}
            type="password"
            value={exportPassword}
            onChange={(event) => setExportPassword(event.target.value)}
            autoComplete="new-password"
          />
        </div>
        <Button type="button" onClick={exportBundle} className="h-auto min-h-10 max-w-full justify-self-start whitespace-normal bg-primary text-left hover:bg-brand-orange-glow">
          <Download className="mr-2 h-4 w-4" />
          Export encrypted vault bundle
        </Button>
      </div>

      <div className="grid gap-3">
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}ImportPassword`}>Bundle import password</Label>
          <Input
            id={`${idPrefix}ImportPassword`}
            type="password"
            value={importPassword}
            onChange={(event) => setImportPassword(event.target.value)}
            autoComplete="current-password"
          />
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".mlab,application/json,application/vnd.massagelab.encrypted+json"
          className="hidden"
          onChange={importBundle}
        />
        <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} className="h-auto min-h-10 max-w-full justify-self-start whitespace-normal text-left">
          <FolderOpen className="mr-2 h-4 w-4" />
          Import encrypted vault bundle
        </Button>
      </div>
    </AppInset>
  )
}

export function PlaintextOutputWarningAction({
  label,
  description,
  icon,
  onConfirm,
  disabled = false,
}: {
  label: string
  description: string
  icon?: ReactNode
  onConfirm: () => void
  disabled?: boolean
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button type="button" variant="outline" disabled={disabled}>
          {icon}
          {label}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Create a plaintext clinical file?</AlertDialogTitle>
          <AlertDialogDescription>
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Create plaintext file</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

function downloadFile(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}
