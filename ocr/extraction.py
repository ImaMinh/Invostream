# import necessary modules for environment variable management
import os
from dotenv import load_dotenv

# import necessary modules for Azure Document Intelligence
from azure.core.credentials import AzureKeyCredential
from azure.ai.documentintelligence import DocumentIntelligenceClient

# import necessary modules and functions from other files
from models import invoice
from models.invoice import Invoice

# --- Azure Document Intelligence Client Initialization ---
async def init_azure_client()->DocumentIntelligenceClient:
    """
    Initializes the Azure Document Intelligence client using credentials from environment variables.
    Returns an instance of DocumentIntelligenceClient.
    """
    try:
        load_dotenv()
        endpoint = os.getenv("DOCUMENTINTELLIGENCE_ENDPOINT")
        key = os.getenv("DOCUMENTINTELLIGENCE_API_KEY")

        if(endpoint and key):
            document_intelligence_client  = DocumentIntelligenceClient(
                endpoint=endpoint, credential=AzureKeyCredential(key)
            )
            print("<--Extraction.py--> Azure Document Intelligence client initialized successfully")
            return document_intelligence_client
        else:
            raise ValueError(f"<--Extraction.py--> Cannot get environment variables: <key>: {key} and <endpoint>: {endpoint}")
    except Exception as e:
        print(f"<--Extraction.py--> Error initializing Azure Document Intelligence client: {e}")
        raise

# --- Invoice Extraction Function ---
async def extract(batch_id: str, file_path: str, document_intelligence_client: DocumentIntelligenceClient)->Invoice:
    """
    Extract structured data from a single invoice file.
    Returns an Invoice object with all fields, confidence scores, and status.
    """
    
    # required non-null fields:
    job_id = f"{batch_id}_{os.path.basename(file_path)}"  # unique identifier for the invoice, can be used as primary key in the database
    file_name = os.path.basename(file_path)
    status = "success"  # default status is success, will be updated to "review" if any field has low confidence
    
    try:
        # 1. Extract the structured data from the invoice using Azure Document Intelligence
        with open(file_path, "rb") as file:
            poller = document_intelligence_client.begin_analyze_document(
                'prebuilt-invoice', body=file
            )
            
        # wait for the extraction to complete and get the results
        analyzed_result = poller.result()
        documents = analyzed_result.documents
        
        if not documents: 
            raise
        
        extracted_invoice = documents[0]
        fields = {}
        
        # 2. Loop through all the fields returned by Azure, and extract the value and confidence score for each field.
        # Flag the invoice for review if any field has a confidence score below the threshold (e.g. 0.8). The threshold can be adjusted based on requirements.
        if(extracted_invoice.fields):
            for field_name, field_value in extracted_invoice.fields.items():
                fields[field_name] = {
                    "value": field_value.content,
                    "confidence": field_value.confidence
                }
                
                if(field_value.confidence is None):
                    status = "failed" 
                else: 
                    if (field_value.confidence < 0.8):  # threshold for review can be adjusted
                        status = "review"
        else:
            raise ValueError(f"<--Extraction.py--> No fields extracted from the invoice {file_path}")  
        
        return Invoice(
            job_id=job_id,
            file_name=file_name,
            status=status,
            template_name=analyzed_result.model_id,
            **fields  # unpack the extracted fields into the Invoice object
        )
    except Exception as e: 
        # catch the error and return a failed Invoice object signaling a failed extraction, so that the pipeline can continue processing other files in the batch
        print(f"<--Extraction.py--> Error extracting invoice from file {file_path}: {e}")
        return Invoice(
            job_id=job_id,
            file_name=file_name,
            status="failed"
        )
        
    
async def extract_invoices(file_paths: list[str], batch_id: str)->list[Invoice]:
    """
    extract invoices for a process batch. Returns a list of extracted invoices as Invoice objects.
    """
    try:
        # initialize Azure Document Intelligence client once for the batch, then reuse for all files in the batch
        document_intelligence_client = await init_azure_client() 
        extracted_invoices: list[Invoice] = []
        for file_path in file_paths:
            extracted_result = await extract(batch_id, file_path, document_intelligence_client=document_intelligence_client)
            extracted_invoices.append(extracted_result)
        return extracted_invoices
    except Exception as e:
        print(f"<--Extraction.py--> Error extracting invoices for batch {batch_id}: {e}")
        raise
