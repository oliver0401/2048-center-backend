import { Entity, Column } from "typeorm";
import { CoreEntity } from "./core.entity";

@Entity("monitor")
export class MonitorEntity extends CoreEntity {
    @Column({ type: "varchar", nullable: false })
    ip: string;

    @Column({ type: "varchar", nullable: false })
    hddid: string;
}
