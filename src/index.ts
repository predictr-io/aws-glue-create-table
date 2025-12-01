import * as core from '@actions/core';
import { GlueClient, CreateTableCommand, UpdateTableCommand, GetTableCommand, TableInput } from '@aws-sdk/client-glue';

/**
 * Main action entry point
 * Creates or updates an AWS Glue Data Catalog table from JSON metadata
 */
async function run(): Promise<void> {
  try {
    // Get inputs
    const databaseName = core.getInput('database-name', { required: true });
    const tableName = core.getInput('table-name', { required: true });
    const tableInputJson = core.getInput('table-input', { required: true });
    const catalogId = core.getInput('catalog-id') || undefined;

    core.info(`Creating/updating Glue table: ${databaseName}.${tableName}`);

    // Parse the table input JSON
    let tableInput: TableInput;
    try {
      tableInput = JSON.parse(tableInputJson);
    } catch (error) {
      throw new Error(`Failed to parse table-input JSON: ${error instanceof Error ? error.message : String(error)}`);
    }

    // Validate table input has required fields
    if (!tableInput.Name) {
      tableInput.Name = tableName;
    }

    if (tableInput.Name !== tableName) {
      core.warning(`TableInput.Name (${tableInput.Name}) differs from table-name input (${tableName}). Using table-name input.`);
      tableInput.Name = tableName;
    }

    // Create Glue client
    const glueClient = new GlueClient({});

    // Check if table exists
    let tableExists = false;
    try {
      core.info('Checking if table already exists...');
      await glueClient.send(new GetTableCommand({
        CatalogId: catalogId,
        DatabaseName: databaseName,
        Name: tableName,
      }));
      tableExists = true;
      core.info('Table exists, will update');
    } catch (error: any) {
      if (error.name === 'EntityNotFoundException') {
        core.info('Table does not exist, will create');
      } else {
        throw error;
      }
    }

    // Create or update the table
    if (tableExists) {
      core.info('Updating existing table...');
      await glueClient.send(new UpdateTableCommand({
        CatalogId: catalogId,
        DatabaseName: databaseName,
        TableInput: tableInput,
      }));
      core.info('Table updated successfully');
    } else {
      core.info('Creating new table...');
      await glueClient.send(new CreateTableCommand({
        CatalogId: catalogId,
        DatabaseName: databaseName,
        TableInput: tableInput,
      }));
      core.info('Table created successfully');
    }

    // Set outputs
    const tableArn = catalogId
      ? `arn:aws:glue:${process.env.AWS_REGION || 'us-east-1'}:${catalogId}:table/${databaseName}/${tableName}`
      : `arn:aws:glue:${process.env.AWS_REGION || 'us-east-1'}:*:table/${databaseName}/${tableName}`;

    core.setOutput('table-name', tableName);
    core.setOutput('database-name', databaseName);
    core.setOutput('table-arn', tableArn);

    core.info(`✓ Action completed successfully - table ${databaseName}.${tableName} ${tableExists ? 'updated' : 'created'}`);
  } catch (error) {
    // Provide comprehensive error information
    core.error('Action failed with error:');

    if (error instanceof Error) {
      core.error(`Error: ${error.message}`);

      if (error.stack) {
        core.error('Stack trace:');
        core.error(error.stack);
      }

      // Check for AWS SDK specific errors
      if ('Code' in error || '$metadata' in error) {
        core.error('AWS SDK Error Details:');
        const awsError = error as any;

        if (awsError.Code) {
          core.error(`  Error Code: ${awsError.Code}`);
        }
        if (awsError.$metadata) {
          core.error(`  HTTP Status: ${awsError.$metadata.httpStatusCode}`);
          core.error(`  Request ID: ${awsError.$metadata.requestId}`);
        }
        if (awsError.message) {
          core.error(`  Message: ${awsError.message}`);
        }
      }

      core.setFailed(`Action failed: ${error.message}`);
    } else {
      core.error(`Unknown error type: ${typeof error}`);
      core.error(`Error value: ${JSON.stringify(error, null, 2)}`);
      core.setFailed('An unknown error occurred - check logs for details');
    }
  }
}

// Run the action
run();
