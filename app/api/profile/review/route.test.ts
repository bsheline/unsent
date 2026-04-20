/**
 * @jest-environment node
 */
import { POST } from "./route";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/db";
import { canGenerate } from "@/lib/subscription";
import { MAX_TEXT_LENGTH } from "@/lib/constants";

jest.mock("@clerk/nextjs/server");
jest.mock("@/lib/db", () => ({
  user: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
}));
jest.mock("@/lib/subscription");
jest.mock("@anthropic-ai/sdk");

describe("POST /api/profile/review", () => {
  const mockUserId = "user_123";

  beforeEach(() => {
    jest.clearAllMocks();
    (auth as jest.Mock).mockReturnValue({ userId: mockUserId });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: mockUserId, plan: "FREE" });
    (canGenerate as jest.Mock).mockReturnValue(true);
  });

  it("returns 400 if bio is too long", async () => {
    const longBio = "a".repeat(MAX_TEXT_LENGTH + 1);
    const req = new Request("http://localhost/api/profile/review", {
      method: "POST",
      body: JSON.stringify({
        bio: longBio,
      }),
    });

    const response = await POST(req);
    expect(response.status).toBe(400);
    const text = await response.text();
    expect(text).toBe("Bio too long");
  });
});
