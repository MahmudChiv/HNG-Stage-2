// src/models/User.model.ts
import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
} from "sequelize-typescript";

@Table({
  tableName: "countries",
  timestamps: false,
})
export class Country extends Model {
  @PrimaryKey
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true
  })
  declare id?: string;

  @Column({
    type: DataType.STRING,
    unique: true,
    allowNull: false,
  })
  declare name: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare capital: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare region: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare population: number;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare currency_code: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  declare exchange_rate: number;

  @Column({
    type: DataType.DECIMAL(20, 2),
    allowNull: true,
  })
  declare estimated_gdp: number;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare flag_url: URL;

  @Column({
    type: DataType.DATE,
    defaultValue: DataType.NOW,
  })
  declare last_refreshed_at: Date;
}
