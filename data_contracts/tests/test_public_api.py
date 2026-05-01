from data_contracts import load_contract, DataContract
from pathlib import Path


def test_public_api_imports():
    contract = load_contract(Path("data_contracts/contract.yaml"))
    assert isinstance(contract, DataContract)
