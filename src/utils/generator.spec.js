const { generateId } = require("./generator");

jest.mock("nanoid", () => ({
  customAlphabet: () => () => "ztYtfy7C1j",
}));

describe("generator", () => {
  describe("#generateID", () => {
    it("should return random id with given length", () => {
      const length = 10;

      const result = generateId(length);

      expect(result.length).toBe(length);
    });

    it("should return random id with allowed characters", () => {
      const characters =
        "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

      const result = generateId();
      const isValid = [...result].every((char) => characters.includes(char));

      expect(isValid).toBe(true);
    });
  });
});
