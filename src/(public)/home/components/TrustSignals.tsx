import { motion } from 'framer-motion';
import { Users, BookOpen, Award, Building } from 'lucide-react';

export default function TrustSignals() {
  const stats = [
    { 
      number: "50+", 
      label: "Years of Excellence", 
      icon: Award,
      description: "A legacy of quality education"
    },
    { 
      number: "25+", 
      label: "Degree Programs", 
      icon: BookOpen,
      description: "Diverse academic offerings"
    },
    { 
      number: "10K+", 
      label: "Alumni", 
      icon: Users,
      description: "Making impact worldwide"
    },
    { 
      number: "5+", 
      label: "Modern Facilities", 
      icon: Building,
      description: "State-of-the-art infrastructure"
    }
  ];

  return (
    <section className="py-16 lg:py-24 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl lg:text-5xl font-bold text-[#1e3c21] mb-4">
            Why Choose UNILUS?
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Join thousands of students who have transformed their futures through our world-class education
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
              className="group relative"
            >
              {/* Background Circle Effect */}
              <div className="absolute inset-0 bg-[#1e3c21]/5 rounded-2xl transform group-hover:scale-105 transition-transform duration-300"></div>
              
              {/* Card Content */}
              <div className="relative p-8 rounded-2xl border-2 border-[#1e3c21]/10 bg-white group-hover:border-[#febb00]/30 transition-all duration-300">
                {/* Icon Container with Circle Background */}
                <div className="mb-6">
                  <div className="w-16 h-16 bg-[#1e3c21] rounded-full flex items-center justify-center mb-4 group-hover:bg-[#febb00] transition-all duration-300">
                    <stat.icon className={`w-8 h-8 ${'group-hover:text-[#1e3c21]'} text-white`} />
                  </div>
                </div>

                {/* Stats Number */}
                <div className="mb-3">
                  <div className="text-5xl font-bold text-[#1e3c21]">
                    {stat.number}
                  </div>
                </div>

                {/* Label */}
                <h3 className="text-xl font-bold text-[#1e3c21] mb-2">
                  {stat.label}
                </h3>

                {/* Description */}
                <p className="text-gray-600 text-sm">
                  {stat.description}
                </p>

                {/* Decorative Line */}
                <div className="h-1 w-12 bg-gradient-to-r from-[#febb00] to-[#1e3c21] rounded mt-4 group-hover:w-16 transition-all duration-300"></div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          viewport={{ once: true }}
          className="text-center mt-16 pt-8 border-t-2 border-[#1e3c21]/10"
        >
          <p className="text-lg text-gray-600 mb-4">
            Ready to be part of our success story?
          </p>
        </motion.div>
      </div>
    </section>
  );
}
