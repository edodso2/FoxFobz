declare namespace App {
  interface Locals {
    /** Email from the verified Cloudflare Access JWT on /admin requests. */
    adminEmail?: string | null;
  }
}
