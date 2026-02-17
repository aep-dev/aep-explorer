export class MissingParentError extends Error {
  constructor(
    public resourceName: string,
    public availableParents: Record<string, string>,
  ) {
    super(`Missing required parent resource: ${resourceName}`);
    this.name = "MissingParentError";
  }
}
