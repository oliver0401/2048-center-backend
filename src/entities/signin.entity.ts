import { Entity, Column } from "typeorm";
import { CoreEntity } from "./core.entity";

@Entity("signin_activity")
export class SigninEntity extends CoreEntity {
    @Column({ type: "varchar", nullable: false })
    address: string;

    @Column({ type: "varchar", nullable: false })
    ipAddress: string;

    @Column({ type: "varchar", nullable: false })
    location: string;
}
