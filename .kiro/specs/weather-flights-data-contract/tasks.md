# Implementation Plan

- [x] 1. Module foundation
- [x] 1.1 Create the `data_contracts/` Python package and verify dependencies
  - Create `data_contracts/__init__.py` (empty for now)
  - Verify PyYAML ≥ 6.0 and Pydantic v2 are importable in the project environment
  - `python -c "import yaml, pydantic; print('ok')"` exits 0 and `import data_contracts` succeeds from the project root
  - _Requirements: 1.5_

- [x] 2. YAML data contract and domain models
- [x] 2.1 (P) Author the `contract.yaml` data contract file
  - Write the `dataset`, `schema`, `quality_assertions`, and `freshness_sla` sections per the design's YAML structure
  - Include all expected columns for `weather_and_flights` with names and dtypes
  - Declare `flight_status: not_null` and `temperature: is_numeric` quality assertions
  - Set freshness SLA to `schedule: daily`, `by_time: "06:00"`
  - Loading the file with PyYAML produces a dict matching the designed YAML contract structure
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_
  - _Boundary: contract.yaml_

- [x] 2.2 (P) Define Pydantic contract models and `ValidationResult` in `models.py`
  - Implement `ColumnSchema`, `QualityAssertion`, `FreshnessSLA`, and `DataContract` Pydantic models with field aliases and `Literal` types per the design interfaces
  - Implement `ValidationResult` frozen dataclass with `clean_records`, `quarantine_records`, `freshness_violation`, `violation_details`, and `clean_count`/`quarantine_count` properties
  - `DataContract.model_validate(raw_dict)` succeeds on a valid input and raises `ValidationError` when required fields are absent or types mismatch
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 3.3, 3.4, 4.1, 4.2, 4.3, 5.2, 5.3_
  - _Boundary: models.py_

- [x] 3. Validation engine
- [x] 3.1 Implement `load_contract()` in `validator.py`
  - Read the YAML file from the given path using PyYAML
  - Pass the parsed dict to `DataContract.model_validate()` and return the result
  - Propagate `FileNotFoundError` unchanged; let `yaml.YAMLError` and `pydantic.ValidationError` surface to the caller without wrapping
  - `load_contract("data_contracts/contract.yaml")` returns a `DataContract` with all fields populated; calling with a non-existent path raises `FileNotFoundError`
  - _Requirements: 1.5_
  - _Depends: 2.1, 2.2_

- [x] 3.2 Implement `_schema_check()` in `validator.py`
  - Verify all column names declared in `contract.schema_` are present in the DataFrame
  - For each present column, verify value type compatibility with the declared dtype using `pd.api.types` helpers
  - Return an empty list when all checks pass; return a list of human-readable violation messages describing each missing column or type mismatch
  - A DataFrame missing a declared column produces a non-empty violation list naming the absent column
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 3.3 (P) Implement `_quality_check()` in `validator.py`
  - For each `QualityAssertion` in the contract, build a boolean bad-record mask: `not_null` flags rows where the column is null (`pd.isna`); `is_numeric` flags rows where the value is null, non-numeric, NaN, or infinite
  - Combine per-assertion masks with logical OR so a row failing any assertion is flagged
  - Return a single boolean `pd.Series` where `True` means the row is a bad record
  - A DataFrame with one null `flight_status` row and one infinite `temperature` row produces a mask with exactly those two rows flagged `True`
  - _Requirements: 3.1, 3.2, 3.3_
  - _Boundary: validator.py — _quality_check function_

- [x] 3.4 (P) Implement `_freshness_check()` in `validator.py`
  - Compute today's SLA deadline by combining `date.today()` with the `by_time` field parsed as `HH:MM`
  - Return `True` (violation) when `last_refreshed` is after the deadline; return `False` when the data is fresh
  - A `last_refreshed` of 07:00 today returns `True`; a `last_refreshed` of 05:00 today returns `False`
  - _Requirements: 5.1, 5.2_
  - _Boundary: validator.py — _freshness_check function_

- [x] 4. Validation orchestration and demo
- [x] 4.1 Implement `validate()` orchestrator in `validator.py`
  - Call `_schema_check()` first; if violations are found, raise `ValueError` with the violation messages (row-level split is undefined when columns are absent)
  - Call `_quality_check()` to get the bad-record mask; split the DataFrame into `clean_records` (mask is `False`) and `quarantine_records` (mask is `True`)
  - Call `_freshness_check()` and include the result in `ValidationResult.freshness_violation`
  - Populate `violation_details` with all schema, quality, and freshness violation messages
  - `validate(mixed_df, contract, last_refreshed)` returns a `ValidationResult` with `quarantine_count > 0`, correct `clean_count`, and `violation_details` listing the failing rows; an all-clean DataFrame returns `quarantine_count == 0`
  - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3, 5.1, 5.2, 5.3_
  - _Depends: 3.3, 3.4_

- [x] 4.2 Build the public API and demo script
  - Update `__init__.py` to re-export `load_contract`, `validate`, `ValidationResult`, and `DataContract`
  - Write `demo.py` that builds a mock `weather_and_flights` DataFrame containing at least one null `flight_status` row, one non-numeric `temperature` row, and several clean rows; calls `load_contract()` and `validate()`; prints the clean count, quarantine count, violation details, and freshness status
  - `python data_contracts/demo.py` completes without exceptions and prints a non-zero quarantine count and at least two violation detail messages
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 4.1, 4.2, 4.3, 5.3_

- [x] 5. Tests
- [x] 5.1 Unit tests for `load_contract()`
  - Test with the bundled `contract.yaml` → returns `DataContract` with correct field values
  - Test with a path that does not exist → raises `FileNotFoundError`
  - Test with a YAML string missing a required field (e.g., no `freshness_sla`) → raises `pydantic.ValidationError`
  - All three test cases pass
  - _Requirements: 1.5_

- [x] 5.2 (P) Unit tests for `_schema_check()` and `_quality_check()`
  - `_schema_check`: conformant DataFrame returns empty list; DataFrame missing a column returns a list naming the absent column; DataFrame with wrong dtype returns a type-mismatch violation
  - `_quality_check`: DataFrame with null `flight_status` → that row flagged; DataFrame with NaN/infinite `temperature` → that row flagged; DataFrame with non-numeric string in `temperature` → that row flagged; all-clean DataFrame → all `False` mask
  - All test cases pass
  - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 3.3_
  - _Boundary: tests for _schema_check, _quality_check_

- [x] 5.3 (P) Unit tests for `_freshness_check()`
  - `last_refreshed` at 05:00 today → returns `False` (fresh)
  - `last_refreshed` at 07:00 today → returns `True` (violation)
  - `last_refreshed` exactly at 06:00 today → returns `False` (at deadline, not past it)
  - All three test cases pass
  - _Requirements: 5.1, 5.2_
  - _Boundary: tests for _freshness_check_

- [x] 5.4 Integration tests for `validate()` end-to-end
  - All-clean DataFrame with fresh data → `quarantine_count == 0`, `clean_count == len(df)`, `freshness_violation == False`
  - Mixed DataFrame (null `flight_status` + non-numeric `temperature`) → correct split counts, `violation_details` non-empty
  - DataFrame missing a required column → `ValueError` raised, no `ValidationResult` returned
  - Fresh data vs. stale data → `freshness_violation` toggles correctly in `ValidationResult`
  - All four integration test cases pass
  - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3, 5.1, 5.2, 5.3_
  - _Depends: 4.1_
