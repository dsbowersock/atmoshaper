import {createServer} from 'node:http'
import {readFile,stat,realpath} from 'node:fs/promises'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

const root=fileURLToPath(new URL('../output/offline-core/core/',import.meta.url))
const port=Number(process.argv[2]??3030)
if(!Number.isInteger(port)||port<1024||port>65535)throw new Error('Choose a loopback preview port.')
const physicalRoot=await realpath(root)
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.woff2':'font/woff2','.ttf':'font/ttf'}
/** Serves only the generated public APK assets. No account endpoint, provider,
 * credential or caller-supplied filesystem root is available in this preview. */
const server=createServer(async(request,response)=>{
 try{
  if(!['GET','HEAD'].includes(request.method)){response.writeHead(405);return response.end()}
  const url=new URL(request.url,'http://127.0.0.1'),pathname=decodeURIComponent(url.pathname)
  const file=path.resolve(root,pathname==='/'?'index.html':'.'+pathname)
  if(!file.startsWith(root)||!(await stat(file)).isFile()||!(await realpath(file)).startsWith(physicalRoot+path.sep))throw new Error('Not public')
  response.writeHead(200,{'Content-Type':types[path.extname(file)]??'application/octet-stream','Cache-Control':'no-store'})
  response.end(request.method==='HEAD'?undefined:await readFile(file))
 }catch{response.writeHead(404,{'Content-Type':'text/plain'});response.end('Not found')}
})
server.listen(port,'127.0.0.1',()=>console.log(`Native website preview: http://127.0.0.1:${port}/`))
