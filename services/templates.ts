import { SupabaseClient } from "@supabase/supabase-js";
import { TemplateCreateInput, TemplateUpdateInput } from "@/lib/zod/templates";
import { TemplatesRepository } from "@/repositories/templates";
import { EmailTemplate } from "@/lib/types/types";

export class TemplatesService {
    private readonly repo: TemplatesRepository;
    constructor(db: SupabaseClient) {
        this.repo = new TemplatesRepository(db);
    }

    list(userId: string) {
        return this.repo.listByUser(userId);
    }

    create(userId: string, input: TemplateCreateInput): Promise<EmailTemplate> {
        return this.repo.createForUser(userId, input as unknown as Omit<EmailTemplate, "id" | "created_at" | "updated_at" | "user_id">);
    }

    update(userId: string, id: string, input: TemplateUpdateInput): Promise<EmailTemplate> {
        return this.repo.updateForUser(userId, id, input);
    }

    async remove(userId: string, id: string): Promise<void> {
        await this.repo.removeForUser(userId, id);
    }
}
