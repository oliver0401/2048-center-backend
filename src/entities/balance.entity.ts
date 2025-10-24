import { Column, Entity } from "typeorm";
import { CoreEntity } from "./core.entity";

@Entity("balance")
export class BalanceEntity extends CoreEntity {
    @Column({ type: "varchar", nullable: false })
    address: string;

    @Column({ type: "float", nullable: false, default: 0})
    etbalance: number;

    @Column({ type: "float", nullable: false, default: 0})
    ecbalance: number;

    @Column({ type: "float", nullable: false, default: 0})
    btbalance: number;

    @Column({ type: "float", nullable: false, default: 0})
    bcbalance: number;

    @Column({ type: "float", nullable: false, default: 0})
    ftbalance: number;

    @Column({ type: "float", nullable: false, default: 0})
    fcbalance: number;
}