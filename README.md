# AWS Glue Create Table Action

GitHub Action to create or update AWS Glue Data Catalog tables using JSON metadata.

## Features

- Create new Glue tables or update existing ones
- Accept full table metadata as JSON (TableInput format)
- Automatic table existence detection
- Support for cross-account catalog access
- Comprehensive error reporting

## Usage

```yaml
- name: Create Glue table
  uses: predictr-io/aws-glue-create-table@v0
  with:
    database-name: 'my_database'
    table-name: 'my_table'
    table-input: |
      {
        "Name": "my_table",
        "StorageDescriptor": {
          "Columns": [
            {"Name": "id", "Type": "bigint"},
            {"Name": "name", "Type": "string"},
            {"Name": "timestamp", "Type": "timestamp"}
          ],
          "Location": "s3://my-bucket/my-data/",
          "InputFormat": "org.apache.hadoop.mapred.TextInputFormat",
          "OutputFormat": "org.apache.hadoop.hive.ql.io.HiveIgnoreKeyTextOutputFormat",
          "SerdeInfo": {
            "SerializationLibrary": "org.apache.hadoop.hive.serde2.lazy.LazySimpleSerDe",
            "Parameters": {
              "field.delim": ","
            }
          }
        },
        "PartitionKeys": [
          {"Name": "year", "Type": "string"},
          {"Name": "month", "Type": "string"}
        ]
      }
```

## Authentication

This action requires AWS credentials to be configured. Use the official AWS configure credentials action:

```yaml
- uses: aws-actions/configure-aws-credentials@v4
  with:
    role-to-assume: arn:aws:iam::123456789012:role/GitHubActionsRole
    aws-region: us-east-1

- uses: predictr-io/aws-glue-create-table@v0
  with:
    database-name: 'my_database'
    table-name: 'my_table'
    table-input: '{"Name": "my_table", ...}'
```

## Inputs

| Input | Required | Default | Description |
|-------|----------|---------|-------------|
| `database-name` | Yes | - | Name of the Glue database |
| `table-name` | Yes | - | Name of the table to create/update |
| `table-input` | Yes | - | Table metadata as JSON (TableInput object) |
| `catalog-id` | No | current account | AWS account ID for cross-account access |

## Outputs

| Output | Description |
|--------|-------------|
| `table-name` | Name of the created/updated table |
| `database-name` | Name of the database containing the table |
| `table-arn` | ARN of the created/updated table |

## Table Input Format

The `table-input` must be a valid JSON object matching the AWS Glue `TableInput` structure. See [AWS Glue TableInput documentation](https://docs.aws.amazon.com/glue/latest/dg/aws-glue-api-catalog-tables.html#aws-glue-api-catalog-tables-TableInput) for full details.

### Minimal Example (CSV in S3)

```json
{
  "Name": "my_table",
  "StorageDescriptor": {
    "Columns": [
      {"Name": "col1", "Type": "string"},
      {"Name": "col2", "Type": "int"}
    ],
    "Location": "s3://my-bucket/data/",
    "InputFormat": "org.apache.hadoop.mapred.TextInputFormat",
    "OutputFormat": "org.apache.hadoop.hive.ql.io.HiveIgnoreKeyTextOutputFormat",
    "SerdeInfo": {
      "SerializationLibrary": "org.apache.hadoop.hive.serde2.lazy.LazySimpleSerDe",
      "Parameters": {"field.delim": ","}
    }
  }
}
```

### Parquet Example

```json
{
  "Name": "parquet_table",
  "StorageDescriptor": {
    "Columns": [
      {"Name": "id", "Type": "bigint"},
      {"Name": "value", "Type": "double"}
    ],
    "Location": "s3://my-bucket/parquet-data/",
    "InputFormat": "org.apache.hadoop.hive.ql.io.parquet.MapredParquetInputFormat",
    "OutputFormat": "org.apache.hadoop.hive.ql.io.parquet.MapredParquetOutputFormat",
    "SerdeInfo": {
      "SerializationLibrary": "org.apache.hadoop.hive.ql.io.parquet.serde.ParquetHiveSerDe"
    }
  }
}
```

## Examples

### Create partitioned table

```yaml
- uses: predictr-io/aws-glue-create-table@v0
  with:
    database-name: 'analytics'
    table-name: 'events'
    table-input: |
      {
        "Name": "events",
        "StorageDescriptor": {
          "Columns": [
            {"Name": "event_id", "Type": "string"},
            {"Name": "user_id", "Type": "string"},
            {"Name": "event_time", "Type": "timestamp"}
          ],
          "Location": "s3://my-bucket/events/",
          "InputFormat": "org.apache.hadoop.hive.ql.io.parquet.MapredParquetInputFormat",
          "OutputFormat": "org.apache.hadoop.hive.ql.io.parquet.MapredParquetOutputFormat",
          "SerdeInfo": {
            "SerializationLibrary": "org.apache.hadoop.hive.ql.io.parquet.serde.ParquetHiveSerDe"
          }
        },
        "PartitionKeys": [
          {"Name": "date", "Type": "string"}
        ]
      }
```

### Use with environment variable

```yaml
- name: Prepare table metadata
  run: |
    cat > table.json <<EOF
    {
      "Name": "my_table",
      "StorageDescriptor": {
        "Columns": [{"Name": "id", "Type": "bigint"}],
        "Location": "s3://my-bucket/data/"
      }
    }
    EOF

- uses: predictr-io/aws-glue-create-table@v0
  with:
    database-name: 'mydb'
    table-name: 'my_table'
    table-input: ${{ steps.prep.outputs.table_json }}
```

## License

MIT
