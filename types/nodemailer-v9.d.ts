/**
 * Keep the historical alias stable while its runtime follows patched
 * Nodemailer releases. Re-export the compatible maintained type contract
 * without installing Auth.js's unused optional Nodemailer runtime peer.
 */
declare module "nodemailer-v9" {
  import nodemailer from "nodemailer"

  export default nodemailer
}
