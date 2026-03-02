import { motion } from 'framer-motion';
import { ArrowRight, BookOpen, Cpu, Stethoscope } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export default function FeaturedPrograms() {
  const programs = [
    {
      title: "Business & Economics",
      description: "Development of business leaders and economic innovators with cutting-edge curriculum in management, accounting, and finance.",
      icon: BookOpen,
      color: "bg-blue-500",
      students: "2,500+",
      highlight: "Most Popular"
    },
    {
      title: "Technology & Engineering",
      description: "Stay ahead in the digital age with programs in software engineering, data science, and emerging technologies.",
      icon: Cpu,
      color: "bg-purple-500",
      students: "1,800+",
      highlight: "Cutting Edge"
    },
    {
      title: "Health Sciences",
      description: "Train for rewarding careers in medicine, nursing, and healthcare management with state-of-the-art facilities.",
      icon: Stethoscope,
      color: "bg-emerald-500",
      students: "1,200+",
      highlight: "Inclusive"
    }
  ];

  return (
    <section className="relative py-16 lg:py-24 bg-white overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#febb00]/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#1e3c21]/5 rounded-full blur-3xl"></div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl lg:text-5xl font-bold text-[#1e3c21] mb-4">
            Featured Academic Programs
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Explore our diverse range of undergraduate and graduate programs designed to prepare you for success
          </p>
        </motion.div>

        {/* Programs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {programs.map((program, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              viewport={{ once: true }}
              whileHover={{ y: -12, transition: { duration: 0.3 } }}
              className="group relative"
            >
              {/* Highlight Badge */}
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ delay: index * 0.15 + 0.3 }}
                viewport={{ once: true }}
                className="absolute -top-3 right-4 z-20"
              >
                <div className="bg-[#febb00] text-[#1e3c21] px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                  {program.highlight}
                </div>
              </motion.div>

              {/* Card */}
              <div className="relative h-full p-8 rounded-2xl border-2 border-[#1e3c21]/10 bg-white hover:border-[#febb00]/30 transition-all duration-300 group-hover:shadow-xl">
                {/* Icon Background */}
                <div className={`w-14 h-14 rounded-xl ${program.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <program.icon className="text-white w-7 h-7" />
                </div>

                {/* Content */}
                <h3 className="text-2xl font-bold text-[#1e3c21] mb-3">
                  {program.title}
                </h3>
                
                <p className="text-gray-600 mb-6 text-sm leading-relaxed">
                  {program.description}
                </p>

                {/* Student Count */}
                <div className="flex items-center gap-2 mb-6 pb-6 border-b-2 border-[#1e3c21]/10">
                  <div className="w-3 h-3 rounded-full bg-[#febb00]"></div>
                  <span className="text-sm font-semibold text-[#1e3c21]">
                    {program.students} Students Enrolled
                  </span>
                </div>

                {/* CTA Button */}
                <Link to="/join" className="inline-block w-full">
                  <Button 
                    variant="outline"
                    size="sm"
                    className="w-full border-2 border-[#1e3c21] text-[#1e3c21] hover:bg-[#1e3c21] hover:text-white font-semibold rounded-lg transition-all duration-300"
                  >
                    Explore Program
                    <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>

              {/* Hover Glow Effect */}
              <div className="absolute inset-0 rounded-2xl bg-[#febb00]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl"></div>
            </motion.div>
          ))}
        </div>

        {/* View All Programs CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          viewport={{ once: true }}
          className="flex justify-center pt-8"
        >
          <Link to="/join" className="inline-block">
            <Button 
              size="lg"
              className="bg-[#febb00] hover:bg-[#e8a900] text-[#1e3c21] font-bold px-12 py-7 text-lg rounded-2xl shadow-lg hover:shadow-lg transition-all duration-300"
            >
              View All Programs
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
