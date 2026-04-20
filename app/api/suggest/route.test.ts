/**
 * @jest-environment node
 */
import { POST } from "./route";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/db";
import { canGenerate } from "@/lib/subscription";
import { MAX_TEXT_LENGTH, MAX_IMAGE_LENGTH } from "@/lib/constants";

jest.mock("@clerk/nextjs/server");
jest.mock("@/lib/db", () => ({
  user: {
    findUnique: jest.fn(),
  },
}));
jest.mock("@/lib/subscription");
jest.mock("@/lib/anthropic", () => ({
  anthropic: {
    messages: {
      create: jest.fn(),
    },
  },
  systemPrompt: "test prompt",
}));

describe("POST /api/suggest", () => {
  const mockUserId = "user_123";

  beforeEach(() => {
    jest.clearAllMocks();
    (auth as jest.Mock).mockReturnValue({ userId: mockUserId });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: mockUserId, plan: "FREE" });
    (canGenerate as jest.Mock).mockReturnValue(true);
  });

  it("returns 400 if input is too long", async () => {
    const longInput = "a".repeat(MAX_TEXT_LENGTH + 1);
    const req = new Request("http://localhost/api/suggest", {
      method: "POST",
      body: JSON.stringify({
        matchId: "match_123",
        input: longInput,
      }),
    });

    const response = await POST(req);
    expect(response.status).toBe(400);
    const text = await response.text();
    expect(text).toBe("Input too long");
  });

  it("returns 400 if imageBase64 is too large", async () => {
    const longImage = "a".repeat(MAX_IMAGE_LENGTH + 1);
    const req = new Request("http://localhost/api/suggest", {
      method: "POST",
      body: JSON.stringify({
        matchId: "match_123",
        imageBase64: longImage,
      }),
    });

    const response = await POST(req);
    expect(response.status).toBe(400);
    const text = await response.text();
    expect(text).toBe("Image too large");
  });
});
