import { InvalidArgumentError } from "../errors/invalid-argument.error";

export interface EnderecoProps {
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string; // UF, ex: SP
  cep: string;
}

export class EnderecoVO {
  public readonly logradouro: string;
  public readonly numero: string;
  public readonly complemento?: string;
  public readonly bairro: string;
  public readonly cidade: string;
  public readonly estado: string;
  public readonly cep: string; // Armazena apenas dígitos

  constructor(props: EnderecoProps) {
    if (!props.logradouro || props.logradouro.trim().length < 3)
      throw new InvalidArgumentError("Logradouro inválido.");
    if (!props.numero || props.numero.trim().length === 0)
      throw new InvalidArgumentError("Número do endereço é obrigatório.");
    if (!props.bairro || props.bairro.trim().length < 2)
      throw new InvalidArgumentError("Bairro inválido.");
    if (!props.cidade || props.cidade.trim().length < 2)
      throw new InvalidArgumentError("Cidade inválida.");
    if (!props.estado || props.estado.trim().length !== 2)
      throw new InvalidArgumentError(
        "Estado (UF) inválido, deve ter 2 caracteres."
      );

    const cepLimpo = props.cep?.replace(/\D/g, "") || "";
    if (cepLimpo.length !== 8)
      throw new InvalidArgumentError("CEP inválido, deve ter 8 dígitos.");

    this.logradouro = props.logradouro.trim();
    this.numero = props.numero.trim();
    this.complemento = props.complemento?.trim();
    this.bairro = props.bairro.trim();
    this.cidade = props.cidade.trim();
    this.estado = props.estado.trim().toUpperCase();
    this.cep = cepLimpo;
  }

  public get cepFormatado(): string {
    return this.cep.replace(/(\d{5})(\d{3})/, "$1-$2");
  }

  public toString(): string {
    let str = `${this.logradouro}, ${this.numero}`;
    if (this.complemento) str += `, ${this.complemento}`;
    str += ` - ${this.bairro}, <span class="math-inline">\{this\.cidade\}/</span>{this.estado} - CEP: ${this.cepFormatado}`;
    return str;
  }
  // --- ADICIONE ESTE MÉTODO ---
  public toJSON() {
    return {
      logradouro: this.logradouro,
      numero: this.numero,
      complemento: this.complemento,
      bairro: this.bairro,
      cidade: this.cidade,
      estado: this.estado,
      cep: this.cep,
    };
  }
}
