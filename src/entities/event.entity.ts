import { Entity, Column } from "typeorm";
import { CoreEntity } from "./core.entity";

@Entity("event")
export class EventEntity extends CoreEntity {
    @Column({ type: "varchar", nullable: false })
    event: string;

    @Column({ type: "varchar", nullable: false })
    address: string;

    @Column({ type: "int", nullable: false })
    time: number;

    @Column({ type: "int", nullable: false })
    score: number;

    @Column({ type: "int", nullable: false })
    swipes: number;

    @Column({ type: "int", nullable: false })
    maxTile: number;
}
