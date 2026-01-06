import { Client } from "@/lib/types/types";
import { type ClientCreateInput, type ClientUpdateInput } from "@/lib/zod/client";
import { ClientsRepository } from "@/repositories/clients";
import { SupabaseClient } from "@supabase/supabase-js";

export class ClientsService {
    private readonly repo: ClientsRepository;

    constructor(db: SupabaseClient) {
        this.repo = new ClientsRepository(db);
    }

    async list(userId: string) {
        return this.repo.listByUser(userId);
    }

    async create(userId: string, input: ClientCreateInput): Promise<Client> {
        return this.repo.createForUser(userId, {
            name: input.name,
            email: input.email,
            phone: input.phone ?? null,
            notes: input.notes ?? null,
        });
    }

    async update(userId: string, id: string, input: ClientUpdateInput): Promise<Client> {
        return this.repo.updateForUser(userId, id, {
            name: input.name as string | undefined,
            email: input.email as string | undefined,
            phone: input.phone ?? undefined,
            notes: input.notes ?? undefined,
        });
    }

    async remove(userId: string, id: string): Promise<void> {
        await this.repo.removeForUser(userId, id);
    }
}
