'use client';
import { useState } from 'react';

const faqData = [
  {
    question: "Quando vou receber meu perfume?",
    answer: "Se você mora em Vitória da Conquista, a entrega é expressa e ocorre em até 24 horas! Para outras cidades do Brasil, o prazo médio é de 2 a 10 dias úteis"
  },
  {
    question: "Quais são as formas de pagamento?",
    answer: "Aceitamos diversas formas de pagamento seguras. Você pode pagar via PIX, Cartão de Crédito em até 5x sem juros, ou Débito."
  },
  {
    question: "Os perfumes são originais?",
    answer: "Trabalhamos com decants premium e perfumes importados. Garantimos a procedência e a qualidade de cada frasco enviado."
  },
  {
    question: "E se eu tiver algum problema com o pedido?",
    answer: "Nossa equipe de suporte está pronta para ajudar. Basta entrar em contato conosco pelo WhatsApp ou Instagram e resolveremos rapidamente."
  }
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleAccordion = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="faq-section" style={{ padding: '60px 20px', background: '#0a0a0a', color: '#f3f4f6' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: 800, textAlign: 'center', marginBottom: '40px', color: '#C9A84C', letterSpacing: 1 }}>Dúvidas Frequentes</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {faqData.map((item, idx) => (
            <div 
              key={idx} 
              style={{ 
                background: '#1a1a1a', 
                borderRadius: '8px', 
                overflow: 'hidden',
                border: '1px solid #333',
                transition: 'border-color 0.3s ease'
              }}
            >
              <button 
                onClick={() => toggleAccordion(idx)}
                style={{
                  width: '100%',
                  background: 'none',
                  border: 'none',
                  padding: '20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                  color: '#fff',
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  textAlign: 'left'
                }}
              >
                {item.question}
                <span style={{ 
                  color: '#C9A84C', 
                  fontSize: '1.5rem', 
                  transform: openIndex === idx ? 'rotate(45deg)' : 'rotate(0deg)',
                  transition: 'transform 0.3s ease'
                }}>
                  +
                </span>
              </button>
              
              <div style={{
                maxHeight: openIndex === idx ? '500px' : '0',
                opacity: openIndex === idx ? 1 : 0,
                overflow: 'hidden',
                transition: 'all 0.3s ease-in-out',
                background: '#111'
              }}>
                <div style={{ padding: '0 20px 20px', color: '#aaa', lineHeight: 1.6 }}>
                  {item.answer}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
