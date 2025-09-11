import { InvalidArgumentError } from "../errors/invalid-argument.error";
import { TipoDocumentoFiscalEnum } from "../enums/tipo-documento-fiscal.enum";

export class DocumentoFiscalVO {
  private readonly _numero: string;
  private readonly _tipo: TipoDocumentoFiscalEnum;

  constructor(
    numero: string,
    tipo: TipoDocumentoFiscalEnum,
    validar: boolean = true
  ) {
    const numeroLimpo = this.limpar(numero);

    if (validar) {
      if (
        tipo === TipoDocumentoFiscalEnum.CPF &&
        !this.validarCpf(numeroLimpo)
      ) {
        throw new InvalidArgumentError("CPF fornecido é inválido.");
      }
      if (
        tipo === TipoDocumentoFiscalEnum.CNPJ &&
        !this.validarCnpj(numeroLimpo)
      ) {
        throw new InvalidArgumentError("CNPJ fornecido é inválido.");
      }
    }

    this._numero = numeroLimpo;
    this._tipo = tipo;
  }

  get numero(): string {
    return this._numero;
  }
  get tipo(): TipoDocumentoFiscalEnum {
    return this._tipo;
  }

  get formatado(): string {
    if (this._tipo === TipoDocumentoFiscalEnum.CPF) {
      return this._numero.replace(
        /(\d{3})(\d{3})(\d{3})(\d{2})/,
        "$1.$2.$3-$4"
      );
    }
    if (this._tipo === TipoDocumentoFiscalEnum.CNPJ) {
      return this._numero.replace(
        /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
        "$1.$2.$3/$4-$5"
      );
    }
    return this._numero;
  }

  private limpar(numero: string): string {
    return (numero || "").replace(/\D/g, "");
  }

  private validarCpf(cpf: string): boolean {
    if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
    let soma = 0;
    let resto;
    for (let i = 1; i <= 9; i++)
      soma += parseInt(cpf.substring(i - 1, i)) * (11 - i);
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf.substring(9, 10))) return false;
    soma = 0;
    for (let i = 1; i <= 10; i++)
      soma += parseInt(cpf.substring(i - 1, i)) * (12 - i);
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf.substring(10, 11))) return false;
    return true;
  }

  private validarCnpj(cnpj: string): boolean {
    if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) return false;
    // ... (lógica de validação de CNPJ)
    return true;
  }
}