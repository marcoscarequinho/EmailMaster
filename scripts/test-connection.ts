import 'dotenv/config';
import mysql from 'mysql2/promise';

async function testConnection() {
  console.log('🔍 Testando conexão com o banco de dados MySQL...\n');

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('❌ DATABASE_URL não está configurada no arquivo .env');
    process.exit(1);
  }

  console.log('📋 URL do banco:', dbUrl.replace(/:[^:@]+@/, ':****@')); // Oculta a senha

  try {
    console.log('\n⏳ Conectando...');
    const connection = await mysql.createConnection(dbUrl);

    console.log('✅ Conexão estabelecida com sucesso!\n');

    // Testar uma query simples
    console.log('🔍 Testando query...');
    const [rows] = await connection.query('SELECT 1 + 1 AS result');
    console.log('✅ Query executada com sucesso:', rows);

    // Verificar versão do MySQL
    const [version] = await connection.query('SELECT VERSION() as version');
    console.log('📊 Versão do MySQL:', (version as any)[0].version);

    // Listar bancos de dados
    const [databases] = await connection.query('SHOW DATABASES');
    console.log('\n📦 Bancos de dados disponíveis:');
    console.log(databases);

    // Verificar banco atual
    const [currentDb] = await connection.query('SELECT DATABASE() as current_db');
    console.log('\n📍 Banco de dados atual:', (currentDb as any)[0].current_db);

    // Listar tabelas se houver banco selecionado
    if ((currentDb as any)[0].current_db) {
      const [tables] = await connection.query('SHOW TABLES');
      console.log('\n📋 Tabelas no banco:');
      console.log(tables);
    }

    await connection.end();
    console.log('\n✅ Teste de conexão concluído com sucesso!');
    process.exit(0);

  } catch (error: any) {
    console.error('\n❌ Erro ao conectar ao banco de dados:');
    console.error('Código:', error.code);
    console.error('Mensagem:', error.message);

    if (error.code === 'ENOTFOUND') {
      console.error('\n💡 O hostname do servidor não pôde ser resolvido. Verifique:');
      console.error('   - Se o endereço IP/hostname está correto');
      console.error('   - Se você tem conexão com a internet');
      console.error('   - Se o servidor está acessível');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Conexão recusada. Verifique:');
      console.error('   - Se o servidor MySQL está rodando');
      console.error('   - Se a porta está correta');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('\n💡 Acesso negado. Verifique:');
      console.error('   - Se o usuário e senha estão corretos');
      console.error('   - Se o usuário tem permissões adequadas');
    }

    process.exit(1);
  }
}

testConnection();
