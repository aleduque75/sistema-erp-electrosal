import { randomUUID } from 'crypto';
import { Identifier } from './identifier';

/**
 * Representa um Identificador Único de Entidade (Value Object).
 * Encapsula a lógica de criação e validação de um ID, geralmente um UUID.
 */
export class UniqueEntityID extends Identifier<string> {
  /**
   * O construtor é privado para forçar o uso do método estático `create`.
   * Isso torna a intenção de criar um ID (seja novo ou a partir de um valor existente) mais explícita.
   * @param id - Um UUID opcional. Se não for fornecido, um novo será gerado.
   */
  private constructor(id?: string) {
    // Se um ID não for fornecido, gera um novo UUID v4.
    // `randomUUID` é o padrão moderno e seguro no Node.js.
    super(id || randomUUID());
  }

  /**
   * Método de fábrica para criar uma instância de UniqueEntityID.
   * @param id - Um UUID opcional para reconstituir um ID existente.
   * @returns Uma nova instância de `UniqueEntityID`.
   */
  public static create(id?: string): UniqueEntityID {
    return new UniqueEntityID(id);
  }
}
