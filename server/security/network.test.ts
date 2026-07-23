import assert from "node:assert/strict";
import test from "node:test";
import { assertExternalUrl, isPrivateOrReservedIp } from "./network";

test("private, loopback, link-local and metadata destinations are blocked", () => {
  for (const address of [
    "127.0.0.1",
    "10.0.0.1",
    "172.16.0.1",
    "192.168.1.1",
    "169.254.169.254",
    "::1",
    "fd00::1",
    "fe80::1",
    "ff02::1",
    "::ffff:7f00:1",
    "2002:7f00:1::",
    "2001:db8::1",
  ]) {
    assert.equal(isPrivateOrReservedIp(address), true, address);
  }
  assert.equal(isPrivateOrReservedIp("8.8.8.8"), false);
  assert.equal(isPrivateOrReservedIp("2606:4700:4700::1111"), false);
});

test("URL validation rejects credentials and local IPs before making a request", async () => {
  await assert.rejects(() => assertExternalUrl("https://user:pass@example.com", () => true));
  await assert.rejects(() => assertExternalUrl("http://127.0.0.1/admin", () => true));
  await assert.rejects(() => assertExternalUrl("file:///etc/passwd", () => true));
});
