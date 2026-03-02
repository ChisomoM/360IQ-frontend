import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  HelpCircle,
  GraduationCap,
  BookOpen
} from 'lucide-react';
import JoinZuteForm from '../../components/JoinZuteForm';
import Navbar from '../../components/navbar';
import Footer from '../../components/footer';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function JoinPage() {

  const faqs = [
    {
      question: "What are the admission requirements?",
      answer: "For undergraduate programs, you need a Grade 12 Certificate with 5 credits including English and Mathematics. For postgraduate, a relevant Bachelor's degree is required.",
    },
    {
      question: "How much is the application fee?",
      answer: "The non-refundable application fee is K200. You will need to upload proof of payment during this application process.",
    },
    {
      question: "When are the intakes?",
      answer: "We have two main intakes: January and July. Applications are open all year round, but submission deadlines apply for each intake.",
    },
    {
      question: "Can I apply for accommodation?",
      answer: "Yes, accommodation application is done after you have been admitted. Spaces are limited and allocated on a first-come, first-served basis.",
    },
    {
      question: "How do I check my application status?",
      answer: "Once you submit, you can log in to the student portal using the credentials you create during this application to track your status.",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative bg-[#1e3c21] py-20 overflow-hidden">
        {/* Decorative background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[url('/grid-pattern.svg')]"></div>
        </div>
        
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#febb00]/20 text-[#febb00] text-sm font-medium border border-[#febb00]/40 mb-6 backdrop-blur-sm">
              <GraduationCap className="w-4 h-4" />
              2026 Admissions Open
            </span>
            
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold text-white leading-tight mb-6">
              Shape Your Future at <span className="text-[#febb00]">UNILUS</span>
            </h1>
            
            <p className="text-lg md:text-xl text-green-100/80 max-w-2xl mx-auto leading-relaxed font-light mb-8">
              Join a community of scholars and innovators. Apply today to start your academic journey with University of Lusaka.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <main className="flex-grow bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 -mt-10 relative z-20">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                <div className="grid lg:grid-cols-12 min-h-[800px]">
                    
                    {/* Left Sidebar / Info (4 cols) */}
                    <div className="lg:col-span-4 bg-gray-50 p-8 border-r border-gray-100">
                        <div className="sticky top-8 space-y-8">
                            <div>
                                <h3 className="text-lg font-semibold text-[#1e3c21] mb-4 flex items-center gap-2">
                                    <BookOpen className="w-5 h-5" />
                                    Application Process
                                </h3>
                                <ul className="space-y-4">
                                    {[
                                        { title: 'Fill Personal Details', desc: 'Name, contact info, bio' },
                                        { title: 'Academic History', desc: 'Previous school & results' },
                                        { title: 'Upload Documents', desc: 'NRC, Results, Payment Proof' },
                                        { title: 'Create Account', desc: 'Set password for portal access' },
                                        { title: 'Await Admission', desc: 'Track status in portal' }
                                    ].map((step, idx) => (
                                        <li key={idx} className="flex gap-3 relative">
                                            <div className="flex flex-col items-center">
                                                <div className="w-6 h-6 rounded-full bg-[#1e3c21]/10 text-[#1e3c21] flex items-center justify-center text-xs font-bold border border-[#1e3c21]/20 z-10">
                                                    {idx + 1}
                                                </div>
                                                {idx < 4 && <div className="w-0.5 h-full bg-gray-200 -my-1"></div>}
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-medium text-gray-900">{step.title}</h4>
                                                <p className="text-xs text-gray-500">{step.desc}</p>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="pt-6 border-t border-gray-200">
                                <h3 className="text-lg font-semibold text-[#1e3c21] mb-4 flex items-center gap-2">
                                    <HelpCircle className="w-5 h-5" />
                                    FAQs
                                </h3>
                                <Accordion type="single" collapsible className="w-full">
                                    {faqs.map((faq, index) => (
                                        <AccordionItem key={index} value={`item-${index}`} className="border-b border-gray-200 last:border-0">
                                            <AccordionTrigger className="text-sm font-medium text-gray-700 hover:text-[#febb00] py-3 text-left">
                                                {faq.question}
                                            </AccordionTrigger>
                                            <AccordionContent className="text-sm text-gray-600 pb-3">
                                                {faq.answer}
                                            </AccordionContent>
                                        </AccordionItem>
                                    ))}
                                </Accordion>
                            </div>
                        </div>
                    </div>

                    {/* Right Content / Form (8 cols) */}
                    <div className="lg:col-span-8 p-8 lg:p-12 bg-white">
                        <div className="max-w-3xl mx-auto">
                            <div className="mb-8">
                                <h2 className="text-2xl font-bold text-gray-900">Student Application Form</h2>
                                <p className="text-gray-500">Please complete all sections accurately.</p>
                            </div>
                            <JoinZuteForm />
                        </div>
                    </div>

                </div>
            </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
