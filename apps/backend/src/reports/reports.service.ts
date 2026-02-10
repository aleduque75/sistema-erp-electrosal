import { Injectable } from '@nestjs/common';
import { GetAccountsPayableReportUseCase } from './use-cases/get-accounts-payable-report.use-case';
import { GetAccountsPayableReportQueryDto } from './dto/get-accounts-payable-report.dto';

@Injectable()
export class ReportsService {
  constructor(
    private readonly getAccountsPayableReportUseCase: GetAccountsPayableReportUseCase,
  ) {}

  getAccountsPayableReport(query: GetAccountsPayableReportQueryDto) {
    return this.getAccountsPayableReportUseCase.execute(query);
  }
}
