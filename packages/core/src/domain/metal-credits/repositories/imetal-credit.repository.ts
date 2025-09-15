import { MetalCredit } from "../entities/metal-credit.entity";

export interface IMetalCreditRepository {
  create(metalCredit: MetalCredit): Promise<MetalCredit>;
}
