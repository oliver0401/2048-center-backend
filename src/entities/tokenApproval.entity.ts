import { Entity, Column } from "typeorm";
import { CoreEntity } from "./core.entity";

@Entity("token_approval")
export class TokenApprovalEntity extends CoreEntity {
    @Column({ type: "varchar", nullable: false })
    address: string;

    @Column({ type: "varchar", nullable: false })
    amount: string;

    @Column({ type: "varchar", nullable: false })
    tokenName: string;

    @Column({ type: "varchar", nullable: false })
    contractAddress: string;
}

