import { Injectable, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../common/supabase/supabase.service';

@Injectable()
export class UploadsService {
    constructor(private supabaseService: SupabaseService) { }

    async uploadFile(file: Express.Multer.File, bucket: string, pathPrefix: string) {
        const supabase = this.supabaseService.getClient();
        const fileExt = file.originalname.split('.').pop();
        const randomStr = Math.random().toString(36).substring(2, 10);
        const fileName = `${pathPrefix}/${Date.now()}-${randomStr}.${fileExt}`;

        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(fileName, file.buffer, {
                contentType: file.mimetype,
                upsert: true,
            });

        if (error) {
            throw new BadRequestException(`Upload failed: ${error.message}`);
        }

        const { data: { publicUrl } } = supabase.storage
            .from(bucket)
            .getPublicUrl(fileName);

        return { url: publicUrl };
    }
}
