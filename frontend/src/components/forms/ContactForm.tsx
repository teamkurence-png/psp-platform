import React, { useState } from 'react';
import { useForm } from '../../hooks/useForm';
import Input from '../ui/Input';
import Label from '../ui/Label';
import Button from '../ui/Button';
import Textarea from '../ui/Textarea';
import SuccessAlert from '../ui/SuccessAlert';
import ErrorAlert from '../ui/ErrorAlert';
import { contactService, type ContactFormData } from '../../services/contactService';
import { Mail, User, MessageSquare } from 'lucide-react';

interface ContactFormProps {
  className?: string;
}

const ContactForm: React.FC<ContactFormProps> = ({ className = '' }) => {
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const { values, errors, loading, handleChange, setError, setLoading, reset } =
    useForm<ContactFormData>({
      name: '',
      email: '',
      message: '',
    });

  const validateForm = (): boolean => {
    let isValid = true;

    // Validate name
    if (!values.name.trim()) {
      setError('name', 'Name is required');
      isValid = false;
    } else if (values.name.trim().length < 2) {
      setError('name', 'Name must be at least 2 characters');
      isValid = false;
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!values.email.trim()) {
      setError('email', 'Email is required');
      isValid = false;
    } else if (!emailRegex.test(values.email)) {
      setError('email', 'Please enter a valid email address');
      isValid = false;
    }

    // Validate message
    if (!values.message.trim()) {
      setError('message', 'Message is required');
      isValid = false;
    } else if (values.message.trim().length < 10) {
      setError('message', 'Message must be at least 10 characters');
      isValid = false;
    }

    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await contactService.submitContactForm(values);
      setSuccessMessage(response.message || 'Thank you for your message! We will get back to you soon.');
      reset();
    } catch (error: any) {
      const message =
        error.response?.data?.error ||
        'Failed to submit your message. Please try again later.';
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={className}>
      {successMessage && (
        <SuccessAlert
          message={successMessage}
        />
      )}

      {errorMessage && (
        <ErrorAlert
          message={errorMessage}
          onDismiss={() => setErrorMessage('')}
        />
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name Field */}
        <div className="space-y-2">
          <Label htmlFor="name" className="text-gray-700">
            Name *
          </Label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <User className="h-5 w-5 text-gray-400" />
            </div>
            <Input
              id="name"
              name="name"
              type="text"
              value={values.name}
              onChange={handleChange}
              placeholder="John Doe"
              className="pl-10"
              disabled={loading}
            />
          </div>
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name}</p>
          )}
        </div>

        {/* Email Field */}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-gray-700">
            Email *
          </Label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-gray-400" />
            </div>
            <Input
              id="email"
              name="email"
              type="email"
              value={values.email}
              onChange={handleChange}
              placeholder="john@example.com"
              className="pl-10"
              disabled={loading}
            />
          </div>
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email}</p>
          )}
        </div>

        {/* Message Field */}
        <div className="space-y-2">
          <Label htmlFor="message" className="text-gray-700">
            Message *
          </Label>
          <div className="relative">
            <div className="absolute top-3 left-3 pointer-events-none">
              <MessageSquare className="h-5 w-5 text-gray-400" />
            </div>
            <Textarea
              id="message"
              name="message"
              value={values.message}
              onChange={handleChange}
              placeholder="Tell us how we can help you..."
              className="pl-10 min-h-[150px] resize-y"
              disabled={loading}
            />
          </div>
          {errors.message && (
            <p className="text-sm text-destructive">{errors.message}</p>
          )}
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={loading}
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Sending...
            </>
          ) : (
            'Send Message'
          )}
        </Button>
      </form>
    </div>
  );
};

export default ContactForm;

