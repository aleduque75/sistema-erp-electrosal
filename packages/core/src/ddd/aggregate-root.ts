// Define uma classe base para suas raízes de agregado, se desejar seguir este padrão.
// Se não, você pode remover esta dependência das suas entidades.
export abstract class AggregateRoot {
    private _domainEvents: any[] = [];

    get domainEvents(): any[] {
        return this._domainEvents;
    }

    protected addDomainEvent(domainEvent: any): void {
        this._domainEvents.push(domainEvent);
        // Idealmente, você teria um sistema para despachar esses eventos.
    }

    public clearEvents(): void {
        this._domainEvents = [];
    }
}
