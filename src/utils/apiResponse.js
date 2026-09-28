export class ApiResponse {
    constructor(statusCode, message = 'Success', data = null) {
      this.success = statusCode < 400;
      this.statusCode = statusCode;
      this.message = message;
      if (data !== null) {
        this.data = data;
      }
    }
  
    // Helper method to send the response directly
    send(res) {
      return res.status(this.statusCode).json(this);
    }
  }