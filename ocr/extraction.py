import os
from azure.core.credentials import AzureKeyCredential
from azure.ai.documentintelligence import DocumentIntelligenceClient
from dotenv import load_dotenv


def extract_invoice(file_path: str):
    """
    Extract structured data from a single invoice file.
    Returns a dict with all fields, confidence scores, and status.
    """
    try:
        load_dotenv()
        endpoint = os.getenv("DOCUMENTINTELLIGENCE_ENDPOINT")
        key = os.getenv("DOCUMENTINTELLIGENCE_API_KEY")

        if(endpoint and key):
            document_intelligence_client  = DocumentIntelligenceClient(
                endpoint=endpoint, credential=AzureKeyCredential(key)
            )
        
            with open(file_path, "rb") as file:
                poller = document_intelligence_client.begin_analyze_document(
                    'prebuilt-invoice', body=file
                )
            
            AnalyzeResult = poller.result()
            
            documents = AnalyzeResult.documents

            if not documents: return # TODO: raise error here
            
            invoice = documents[0]
            
            # extract all fields Azure returned, regardless of which ones
            fields = {}
            
            if(invoice.fields):
                for field_name, field_value in invoice.fields.items():
                    fields[field_name] = {
                        "value": field_value.content,
                        "confidence": field_value.confidence
                    }
                
            # routing decision based on critical field confidence
            critical_fields = ["InvoiceId", "InvoiceDate", "VendorTaxId", "InvoiceTotal"]
            needs_review = any(
                fields.get(f) is None or
                fields[f]["confidence"] is None or
                fields[f]["confidence"] < 0.85
                for f in critical_fields
            )
            
            return {
                "status": "review" if needs_review else "done",
                "fields": fields
            }
        else:
            print(f"Cannot retrieve <key>: {key} and <endpoint>: {endpoint}")
    except Exception as e: 
        print(e)
        raise
    
    
async def extract_invoices(file_paths: list[str], batch_id: str):
    """
    Batch wrapper - extracts invoices for all files in a batch.
    Returns a list of extraction results in the same order as input.
    """
    try: 
        results = []
        for file_path in file_paths:
            extracted = extract_invoice(file_path)
            results.append(extracted)
        return results
    except Exception as e:
        print(f"failed to extract invoices for batch {batch_id}: {e}")
        raise