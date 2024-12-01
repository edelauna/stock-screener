import { getContentType } from "./headers";

function generateUUID() {
  // Create a byte array of 16 bytes
  const randomValues = new Uint8Array(16);
  
  // Use the crypto API to fill the array with random values
  crypto.getRandomValues(randomValues); // Use 'crypto.getRandomValues()' in the browser
  
  // Set the version (4) and the variant bits: 10xx
  randomValues[6] = (randomValues[6] & 0x0f) | 0x40; // Version 4
  randomValues[8] = (randomValues[8] & 0x3f) | 0x80; // Variant: `10`

  // Convert byte array to hex string
  const uuid = Array.from(randomValues)
      .map((byte) => {
          return ('0' + byte.toString(16)).slice(-2); // Convert to hex and pad if needed
      })
      .join('')
      .replace(/^(.{8})(.{4})(.{4})(.{4})(.{12})$/, '$1-$2-$3-$4-$5'); // Format as UUID

  return uuid;
}

export const internalServerError = async (msg: String, ctx: {} | null = null): Promise<Response>  => {
  const requestId = generateUUID()
  console.log({
    error:msg,
    requestId, 
    ...ctx
  })
  return new Response(JSON.stringify({
    message:"Server Error",
    requestId
  }), {
    status: 500,
    statusText: "Internal Server Error",
    headers: {
      ...getContentType("JSON")
    }
  })
}