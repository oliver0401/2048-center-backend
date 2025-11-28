import { Entity, Column, PrimaryColumn } from "typeorm";

@Entity("price")
export class PriceEntity {
    @PrimaryColumn({ type: "varchar", unique: true, nullable: false })
    token: string;

    @Column({ type: "float", nullable: false })
    price: number;
}
