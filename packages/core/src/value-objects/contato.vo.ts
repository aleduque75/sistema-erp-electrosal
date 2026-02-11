import { EmailVO } from "./email.vo";
import { TelefoneVO } from "./telefone.vo";
import { InvalidArgumentError } from "../errors/invalid-argument.error";

// Props para criar um ContatoVO. Email é obrigatório.
export interface ContatoProps {
  email: EmailVO; // EmailVO é obrigatório para criar um ContatoVO
  telefone?: TelefoneVO; // TelefoneVO é opcional
}

export class ContatoVO {
  public readonly email: EmailVO; // Não é mais opcional aqui, pois o construtor garante
  public readonly telefone?: TelefoneVO;

  constructor(props: ContatoProps) {
    if (!props.email || !(props.email instanceof EmailVO)) {
      throw new InvalidArgumentError(
        "Instância de EmailVO é obrigatória para o Contato."
      );
    }
    // Se telefone for fornecido, deve ser uma instância de TelefoneVO
    if (
      props.telefone !== undefined &&
      !(props.telefone instanceof TelefoneVO)
    ) {
      throw new InvalidArgumentError(
        "Telefone fornecido para Contato deve ser uma instância de TelefoneVO ou undefined."
      );
    }

    this.email = props.email;
    this.telefone = props.telefone;
    Object.freeze(this);
  }

  public equals(outro: ContatoVO): boolean {
    if (this.email.valor !== outro.email.valor) return false;
    if ((this.telefone?.valor || null) !== (outro.telefone?.valor || null))
      return false;
    return true;
  }

  public toJSON() {
    return {
      email: this.email.valor,
      telefone: this.telefone?.valor,
    };
  }

  
}