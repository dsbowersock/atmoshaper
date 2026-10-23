import assert from "node:assert/strict"
import {EventEmitter} from "node:events"
import {readFile} from "node:fs/promises"
import {createRequire} from "node:module"
import net from "node:net"
import tls from "node:tls"
import {after,it} from "node:test"
import {PrismaClient} from "@prisma/client"
import {createCompiledModuleLoader} from "./helpers/compiled-module.mjs"
const require=createRequire(import.meta.url)
const {PrismaNeon}=require("@prisma/adapter-neon")
const originals=[net.Socket.prototype.connect,tls.connect,globalThis.fetch]
const blocked=()=>{throw new Error("OFFLINE_LOCK_TEST_NETWORK_BLOCKED")}
net.Socket.prototype.connect=blocked;tls.connect=blocked;globalThis.fetch=blocked
after(()=>{[net.Socket.prototype.connect,tls.connect,globalThis.fetch]=originals})
const source=await readFile(new URL("../lib/anatomime-progress-server.ts",import.meta.url),"utf8")
const service=createCompiledModuleLoader(import.meta.url)(source,"lib/anatomime-progress-server.lock-test.ts",{
  "./anatomime-shared.ts":{},"./flashcard-progress.ts":{},
})

/**
 * Uses the installed Prisma compiler and Neon decoder with an invented PostgreSQL
 * wire response. The wire enforces PostgreSQL's int4/int4 signature; it cannot
 * establish real database persistence or actual lock contention.
 */
async function localCompiler(run){
  const factory=new PrismaNeon({connectionString:"postgresql://invented:invented@127.0.0.1:1/invented"})
  const adapter=await factory.connect(),pool=adapter.underlyingDriver(),queries=[]
  const connection=new EventEmitter()
  connection.release=()=>{}
  connection.query=async(options,args)=>{
    const sql=options.text??options
    if(!sql.includes("pg_advisory_xact_lock"))return {fields:[],rows:[],rowCount:0}
    queries.push({sql,args})
    if(!/pg_advisory_xact_lock\(\$1::(?:int|integer),\s*\$2::(?:int|integer)\)/.test(sql)){
      const error=new Error("function pg_advisory_xact_lock(bigint, bigint) does not exist")
      Object.assign(error,{code:"42883",severity:"ERROR"});throw error
    }
    const castToText=/pg_advisory_xact_lock\([^)]*\)::text/.test(sql)
    return {fields:[{name:"pg_advisory_xact_lock",dataTypeID:castToText?25:2278}],rows:[[""]],rowCount:1}
  }
  pool.connect=async()=>connection;pool.query=connection.query;pool.end=async()=>{}
  const client=new PrismaClient({adapter:{provider:"postgres",adapterName:factory.adapterName,connect:async()=>adapter},log:[]})
  try{return await run(client,queries)}finally{await client.$disconnect()}
}
it("acquires the same user/prompt lock with int4 parameters and a supported result type",async()=>{
  await localCompiler(async(client,queries)=>{
    await client.$transaction(async(tx)=>{
      await service.lockFlashcardLinkedProgress(tx,"invented-user-a","invented-prompt-a")
      await service.lockFlashcardLinkedProgress(tx,"invented-user-a","invented-prompt-a")
      await service.lockFlashcardLinkedProgress(tx,"invented-user-b","invented-prompt-a")
    })
    assert.equal(queries.length,3)
    assert.deepEqual(queries[0].args,queries[1].args)
    assert.notEqual(queries[0].args[1],queries[2].args[1])
    assert.equal(Number(queries[0].args[0]),7341)
    assert.ok(queries.every(query=>Number.isInteger(Number(query.args[1])) && Number(query.args[1])>=-2147483648 && Number(query.args[1])<=2147483647))
  })
})
it("the installed decoder rejects the native void lock result even with valid int4 inputs",async()=>{
  await localCompiler(async(client)=>{
    await assert.rejects(client.$transaction(tx=>tx.$queryRaw`SELECT pg_advisory_xact_lock(${7341}::int, ${42}::int)`),error=>error.code==="P2010" && JSON.stringify(error.meta??{}).includes("void"))
  })
})
