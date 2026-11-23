/** The packaged device tools are not an authenticated website origin. Real
 * account screens use the browser-owned app window; never forge a web session. */
export function useSession() { return { data: null, status: "unauthenticated", update: async () => null } }
export async function signIn() { location.href = "https://www.atmoshaper.com/login?android_app=1" }
export async function signOut() { location.href = "https://www.atmoshaper.com/account?android_app=1" }

