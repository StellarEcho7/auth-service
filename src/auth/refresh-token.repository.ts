import { Injectable } from '@nestjs/common';
import { createHash, randomUUID } from 'node:crypto';

export interface RefreshTokenRecord {
  id: string;
  userId: string;
  tokenHash: string;
  familyId: string;
  createdAt: Date;
  expiresAt: Date;
  revokedAt: Date | null;
}

export interface CreateRefreshTokenInput {
  userId: string;
  token: string;
  familyId: string;
  expiresAt: Date;
}

export interface RotateRefreshTokenInput {
  token: string;
  expiresAt: Date;
}

export type RotateRefreshTokenResult =
  | { status: 'rotated'; record: RefreshTokenRecord }
  | { status: 'expired' }
  | { status: 'reused' }
  | { status: 'invalid' };

@Injectable()
export class RefreshTokenRepository {
  // In-memory placeholder store – replace with a proper DB later
  private readonly tokens: RefreshTokenRecord[] = [];

  async create(input: CreateRefreshTokenInput): Promise<RefreshTokenRecord> {
    await Promise.resolve();
    return this.insert(input, new Date());
  }

  async findByToken(token: string): Promise<RefreshTokenRecord | null> {
    await Promise.resolve();
    return this.findByHash(this.hashToken(token));
  }

  async rotate(
    token: string,
    next: RotateRefreshTokenInput,
    now: Date = new Date(),
  ): Promise<RotateRefreshTokenResult> {
    // Yield first, then check + revoke + insert in one synchronous block so
    // concurrent rotations of the same token cannot both succeed.
    await Promise.resolve();
    const current = this.findByHash(this.hashToken(token));

    if (!current) {
      return { status: 'invalid' };
    }

    if (current.revokedAt) {
      this.revokeFamilySync(current.familyId, now);
      return { status: 'reused' };
    }

    if (current.expiresAt.getTime() <= now.getTime()) {
      current.revokedAt = now;
      return { status: 'expired' };
    }

    current.revokedAt = now;
    const record = this.insert(
      {
        userId: current.userId,
        token: next.token,
        familyId: current.familyId,
        expiresAt: next.expiresAt,
      },
      now,
    );
    return { status: 'rotated', record };
  }

  async revokeByToken(token: string, now: Date = new Date()): Promise<void> {
    await Promise.resolve();
    const record = this.findByHash(this.hashToken(token));
    if (record && !record.revokedAt) {
      record.revokedAt = now;
    }
  }

  async revokeFamily(familyId: string, now: Date = new Date()): Promise<void> {
    await Promise.resolve();
    this.revokeFamilySync(familyId, now);
  }

  private insert(
    input: CreateRefreshTokenInput,
    now: Date,
  ): RefreshTokenRecord {
    const record: RefreshTokenRecord = {
      id: randomUUID(),
      userId: input.userId,
      tokenHash: this.hashToken(input.token),
      familyId: input.familyId,
      createdAt: now,
      expiresAt: input.expiresAt,
      revokedAt: null,
    };
    this.tokens.push(record);
    return record;
  }

  private findByHash(tokenHash: string): RefreshTokenRecord | null {
    return this.tokens.find((token) => token.tokenHash === tokenHash) ?? null;
  }

  private revokeFamilySync(familyId: string, now: Date): void {
    for (const token of this.tokens) {
      if (token.familyId === familyId && !token.revokedAt) {
        token.revokedAt = now;
      }
    }
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
