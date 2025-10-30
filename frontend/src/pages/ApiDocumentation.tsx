import { useEffect } from 'react';
import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';

export const ApiDocumentation = () => {
  const API_BASE_URL = import.meta.env.VITE_API_URL?.replace(/\/api$/, '') || 'https://psp-platform-8nm0.onrender.com';

  useEffect(() => {
    // Set page title
    document.title = 'API Documentation - PSP Platform';
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Custom Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-8 px-6 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold mb-3">PSP Platform API Documentation</h1>
          <p className="text-blue-100 text-lg">
            Complete API reference for integrating payment requests into your applications
          </p>
          <div className="mt-4 flex gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-400 rounded-full"></span>
              <span>Version 1.0.0</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
              <span>REST API</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
              <span>OpenAPI 3.0</span>
            </div>
          </div>
        </div>
      </div>

      {/* Swagger UI Container */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <SwaggerUI
          url={`${API_BASE_URL}/api/docs.json`}
          docExpansion="list"
          defaultModelsExpandDepth={1}
          defaultModelExpandDepth={1}
          displayRequestDuration={true}
          filter={true}
          persistAuthorization={true}
          tryItOutEnabled={true}
        />
      </div>

      {/* Custom Footer */}
      <div className="border-t bg-gray-50 py-8 px-6 mt-12">
        <div className="max-w-7xl mx-auto text-center text-gray-600">
          <p className="mb-2">
            Need help? Contact us at{' '}
            <a href="mailto:support@pspplatform.com" className="text-blue-600 hover:underline">
              support@pspplatform.com
            </a>
          </p>
          <p className="text-sm text-gray-500">
            © 2024 PSP Platform. All rights reserved.
          </p>
        </div>
      </div>

      {/* Custom Styles */}
      <style>{`
        /* Custom Swagger UI styling to match your brand */
        .swagger-ui .topbar {
          display: none;
        }
        
        .swagger-ui .info .title {
          display: none;
        }
        
        .swagger-ui .info .description {
          margin-top: 0;
        }
        
        .swagger-ui .scheme-container {
          background: #f8fafc;
          box-shadow: none;
          border: 1px solid #e2e8f0;
          padding: 20px;
          border-radius: 8px;
        }
        
        .swagger-ui .opblock-tag {
          border-bottom: 2px solid #e2e8f0;
          padding: 10px 0;
        }
        
        .swagger-ui .opblock-tag-section {
          margin-bottom: 20px;
        }
        
        .swagger-ui .opblock {
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          margin-bottom: 10px;
        }
        
        .swagger-ui .opblock.opblock-post {
          border-color: #10b981;
          background: rgba(16, 185, 129, 0.05);
        }
        
        .swagger-ui .opblock.opblock-get {
          border-color: #3b82f6;
          background: rgba(59, 130, 246, 0.05);
        }
        
        .swagger-ui .opblock.opblock-delete {
          border-color: #ef4444;
          background: rgba(239, 68, 68, 0.05);
        }
        
        .swagger-ui .opblock-summary-method {
          border-radius: 6px;
          font-weight: 600;
        }
        
        .swagger-ui .btn.authorize {
          background-color: #2563eb;
          border-color: #2563eb;
        }
        
        .swagger-ui .btn.authorize:hover {
          background-color: #1d4ed8;
        }
        
        .swagger-ui .btn.execute {
          background-color: #10b981;
          border-color: #10b981;
        }
        
        .swagger-ui .btn.execute:hover {
          background-color: #059669;
        }
        
        .swagger-ui .response-col_status {
          font-weight: 600;
        }
        
        .swagger-ui .model-box {
          background: #f8fafc;
          border-radius: 6px;
        }
        
        /* Make it responsive */
        @media (max-width: 768px) {
          .swagger-ui .opblock-summary {
            flex-direction: column;
            align-items: flex-start !important;
          }
          
          .swagger-ui .opblock-summary-path {
            margin-top: 8px;
          }
        }
      `}</style>
    </div>
  );
};

export default ApiDocumentation;

