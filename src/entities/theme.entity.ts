import { Entity, Column, ManyToMany, JoinTable, JoinColumn, ManyToOne } from "typeorm";
import { CoreEntity } from "./core.entity";
import { UserEntity } from "./user.entity";

@Entity("theme")
export class ThemeEntity extends CoreEntity {
  @Column({ type: "varchar", nullable: true })
  title: string;

  @Column({ type: "varchar", nullable: true })
  description: string;

  @Column({ type: "json", nullable: true })
  2: Record<string, string>;

  @Column({ type: "json", nullable: true })
  4: Record<string, string>;

  @Column({ type: "json", nullable: true })
  8: Record<string, string>;

  @Column({ type: "json", nullable: true })
  16: Record<string, string>;

  @Column({ type: "json", nullable: true })
  32: Record<string, string>;

  @Column({ type: "json", nullable: true })
  64: Record<string, string>;

  @Column({ type: "json", nullable: true })
  128: Record<string, string>;

  @Column({ type: "json", nullable: true })
  256: Record<string, string>;

  @Column({ type: "json", nullable: true })
  512: Record<string, string>;

  @Column({ type: "json", nullable: true })
  1024: Record<string, string>;

  @Column({ type: "json", nullable: true })
  2048: Record<string, string>;

  @Column({ type: "json", nullable: true })
  4096: Record<string, string>;

  @Column({ type: "json", nullable: true })
  8192: Record<string, string>;

  @Column({ type: "json", nullable: true })
  16384: Record<string, string>;

  @Column({ type: "json", nullable: true })
  32768: Record<string, string>;

  @Column({ type: "json", nullable: true })
  65536: Record<string, string>;

  @Column({ type: "boolean", nullable: true })
  numberDisplay: boolean;

  @Column({ type: "text", nullable: true })
  numberColor: string;

  @Column({ type: "int", nullable: true })
  numberSize: number;

  @Column({
    type: "enum",
    enum: ["center", "top-left", "bottom-right", "top-right", "bottom-left"],
    nullable: true,
  })
  position:
    | "center"
    | "top-left"
    | "bottom-right"
    | "top-right"
    | "bottom-left";

  @Column({
    type: "enum",
    enum: ["premium", "public", "private"],
    nullable: true,
  })
  visibility: "premium" | "public" | "private";

  @Column({ type: "float", nullable: true })
  price: number;

  @Column({ nullable: true })
  creator_id: string;

  @ManyToMany(() => UserEntity, (user) => user.themes)
  @JoinTable({
    name: "user_themes", // name of the join table
    joinColumn: {
      name: "theme_id",
      referencedColumnName: "uuid",
    },
    inverseJoinColumn: {
      name: "user_id",
      referencedColumnName: "uuid",
    },
  })
  users: UserEntity[];
}
