import { AppDataSource } from "setup";
import { Repository } from "typeorm";
import { MonitorEntity } from "../entities";

export const createMonitor = async ({ ip, hddid }: { ip: string, hddid: string }) => {
    const monitorRepository: Repository<MonitorEntity> =
        AppDataSource.getRepository(MonitorEntity);

    // Check uniqueness of hddid
    const existing = await monitorRepository.findOne({ where: { hddid } });
    if (existing) {
        throw new Error("Monitor with this hddid already exists.");
    }

    const monitor = monitorRepository.create({ ip, hddid });
    await monitorRepository.save(monitor);
    return monitor;
};