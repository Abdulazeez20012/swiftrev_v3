
import type { IStorage } from './Storage';
import { LocalRepository } from './LocalRepository';
import type { BaseRepository } from './Repository';
import type {
    Hospital,
    Department,
    RevenueItem,
    Transaction,
    HospitalWallet,
    AuditLog
} from '../types';



export class DataService {
    private static instance: DataService;

    // HERMS Repositories
    private hospitalRepo: BaseRepository<Hospital>;
    private departmentRepo: BaseRepository<Department>;
    private revenueItemRepo: BaseRepository<RevenueItem>;
    private transactionRepo: BaseRepository<Transaction>;
    private walletRepo: BaseRepository<HospitalWallet>;
    private auditLogRepo: BaseRepository<AuditLog>;

    private constructor(storage: IStorage) {
        this.hospitalRepo = new LocalRepository<Hospital>(storage, 'hospitals');
        this.departmentRepo = new LocalRepository<Department>(storage, 'departments');
        this.revenueItemRepo = new LocalRepository<RevenueItem>(storage, 'revenue_items');
        this.transactionRepo = new LocalRepository<Transaction>(storage, 'transactions');
        this.walletRepo = new LocalRepository<HospitalWallet>(storage, 'hospital_wallets');
        this.auditLogRepo = new LocalRepository<AuditLog>(storage, 'audit_logs');
    }

    public static getInstance(storage: IStorage): DataService {
        if (!DataService.instance) {
            DataService.instance = new DataService(storage);
        }
        return DataService.instance;
    }

    // Accessors
    public hospitals() { return this.hospitalRepo; }
    public departments() { return this.departmentRepo; }
    public revenueItems() { return this.revenueItemRepo; }
    public transactions() { return this.transactionRepo; }
    public wallets() { return this.walletRepo; }
    public auditLogs() { return this.auditLogRepo; }

    /**
     * Core Transaction Logic: Credit Wallet
     */
    public async creditHospitalWallet(hospitalId: string, amount: number, _sourceRef: string, _description: string) {
        try {
            // 1. Get or Create Wallet
            const allWallets = await this.walletRepo.getAll();
            let wallet = allWallets.data?.find(w => w.hospital_id === hospitalId);

            if (!wallet) {
                const newWallet = await this.walletRepo.create({
                    hospital_id: hospitalId,
                    total_balance: 0,
                    last_updated: new Date().toISOString()
                } as any);
                if (newWallet.error) throw newWallet.error;
                wallet = newWallet.data!;
            }

            // 2. Update Balance
            const newBalance = wallet.total_balance + amount;
            await this.walletRepo.update(wallet.id, {
                total_balance: newBalance,
                last_updated: new Date().toISOString()
            });

            // 3. Log Audit (System level)
            // Note: In real HERMS, we might have a separate 'funding' log equivalent to transactions
            // For now, we assume this is triggered by a specialized "Wallet Funding" transaction type if needed,
            // or we just rely on the AuditLog.

            return { data: { ...wallet, total_balance: newBalance }, error: null };

        } catch (error: any) {
            return { data: null, error };
        }
    }
}
