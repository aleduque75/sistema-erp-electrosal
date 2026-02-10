import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { ImportSalesUseCase } from './import-sales.use-case';
import { ImportEmpresasUseCase } from './import-empresas.use-case';
import { ImportProductsUseCase } from './import-products.use-case';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const importSalesUseCase = app.get(ImportSalesUseCase);
  const importEmpresasUseCase = app.get(ImportEmpresasUseCase);
  const importProductsUseCase = app.get(ImportProductsUseCase);

  const organizationId = 'bb1363c5-3b6c-4353-9381-1dfd5b241162'; // Hardcoded for the script
  const userId = '78fb94b9-ecfd-4b06-a524-3e4a44217df6'; // Hardcoded for the script
  const jsonDirectory = '/home/aleduque/Documentos/cursos/sistema-erp-electrosal/json-imports';

  try {
    const empresasResults = await importEmpresasUseCase.execute(organizationId, jsonDirectory);
    console.table(empresasResults.filter(r => r.status === 'failed'));
    console.table(empresasResults.filter(r => r.status === 'created'));
    console.table(empresasResults.filter(r => r.status === 'updated'));

    const productsResults = await importProductsUseCase.execute(organizationId, jsonDirectory);
    console.table(productsResults.filter(r => r.status === 'failed'));
    console.table(productsResults.filter(r => r.status === 'success'));

    const salesResults = await importSalesUseCase.execute(organizationId, userId, jsonDirectory);
    console.table(salesResults.filter(r => r.status === 'failed'));
    console.table(salesResults.filter(r => r.status === 'success'));

  } catch (error) {
  } finally {
    await app.close();
  }
}

bootstrap();