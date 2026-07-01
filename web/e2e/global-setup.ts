import { assertLocalEnvironment } from "./helpers/environment-guard";

export default function globalSetup() {
  assertLocalEnvironment();
}
