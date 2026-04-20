/**
 * @jest-environment node
 */
import { POST } from "./route";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/db";
import { MAX_TEXT_LENGTH } from "@/lib/constants";

jest.mock("@clerk/nextjs/server");
jest.mock("@/lib/db", () => ({
  user: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
}));
jest.mock("@/lib/anthropic", () => ({
  anthropic: {
    messages: {
      create: jest.fn(),
    },
  },
}));

describe("POST /api/style-profile", () => {
  const mockUserId = "user_123";

  beforeEach(() => {
    jest.clearAllMocks();
    (auth as jest.Mock).mockReturnValue({ userId: mockUserId });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: mockUserId });
  });

  it("returns 400 if text is too long", async () => {
    const longText = "a".repeat(MAX_TEXT_LENGTH + 1);
    const req = new Request("http://localhost/api/style-profile", {
      method: "POST",
      body: JSON.stringify({
        text: longText,
      }),
    });

    const response = await POST(req);
    expect(response.status).toBe(400);
    const text = await response.text();
    expect(text).toBe("Text too long");
  });
});
