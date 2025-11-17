

// Função melhorada para exportar PDF profissional
function exportElementToPDF(element, filename = 'export.pdf', metadata = {}) {
  if (!element) return alert('Elemento para exportar não encontrado.');
  
  try {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const margin = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const contentWidth = pageWidth - (margin * 2);
    let yPosition = margin;

    // CABEÇALHO PROFISSIONAL
    const addHeader = () => {
      // Logo/Nome da empresa
      doc.setFillColor(40, 167, 69);
      doc.rect(0, 0, pageWidth, 35, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('Dieta Popular', margin, 15);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Sistema de Avaliação Nutricional', margin, 22);
      doc.text('www.dietapopular.com.br', margin, 28);
      
      yPosition = 45;
    };

    // RODAPÉ PROFISSIONAL
    const addFooter = (pageNum) => {
      const footerY = pageHeight - 15;
      
      doc.setDrawColor(40, 167, 69);
      doc.setLineWidth(0.5);
      doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);
      
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.setFont('helvetica', 'normal');
      
      // Informações do nutricionista
      const nutricionistaInfo = metadata.nutricionista || 'Dr(a). Nutricionista';
      const crn = metadata.crn || 'CRN: 12345/P';
      doc.text(nutricionistaInfo + ' - ' + crn, margin, footerY);
      
      // Data de emissão
      const dataEmissao = new Date().toLocaleDateString('pt-BR');
      doc.text('Emitido em: ' + dataEmissao, pageWidth / 2, footerY, { align: 'center' });
      
      // Número da página
      doc.text('Página ' + pageNum, pageWidth - margin, footerY, { align: 'right' });
    };

    // Função para adicionar nova página com header/footer
    let pageNum = 1;
    const addNewPage = () => {
      pageNum++;
      doc.addPage();
      addHeader();
      addFooter(pageNum);
    };

    // Função para adicionar texto com quebra de linha
    const addText = (text, fontSize = 11, isBold = false, color = [0, 0, 0]) => {
      doc.setFontSize(fontSize);
      doc.setFont('helvetica', isBold ? 'bold' : 'normal');
      doc.setTextColor(color[0], color[1], color[2]);
      
      const lines = doc.splitTextToSize(text, contentWidth);
      
      lines.forEach(line => {
        if (yPosition > pageHeight - 25) {
          addNewPage();
        }
        doc.text(line, margin, yPosition);
        yPosition += fontSize * 0.5;
      });
      
      yPosition += 2;
    };

    // Adicionar título do documento
    const addTitle = (text) => {
      if (yPosition > pageHeight - 40) {
        addNewPage();
      }
      doc.setFillColor(240, 240, 240);
      doc.rect(margin - 5, yPosition - 5, contentWidth + 10, 12, 'F');
      addText(text, 16, true, [40, 167, 69]);
      yPosition += 3;
    };

    // Adicionar seção
    const addSection = (title, content) => {
      if (yPosition > pageHeight - 35) {
        addNewPage();
      }
      addText(title, 13, true, [40, 167, 69]);
      addText(content, 11, false);
      yPosition += 3;
    };

    // Adicionar header e footer da primeira página
    addHeader();
    addFooter(pageNum);

    // INFORMAÇÕES DO CLIENTE (se disponível)
    if (metadata.clienteNome) {
      addTitle('Informações do Cliente');
      addSection('Nome:', metadata.clienteNome);
      if (metadata.clienteEmail) addSection('Email:', metadata.clienteEmail);
      if (metadata.clienteIdade) addSection('Idade:', metadata.clienteIdade + ' anos');
      yPosition += 5;
    }

    // Processar conteúdo do elemento
    const title = element.querySelector('h1, h2');
    if (title && !metadata.clienteNome) {
      addTitle(title.textContent);
    }

    const cards = element.querySelectorAll('.card');
    cards.forEach((card, index) => {
      const cardTitle = card.querySelector('h2, h3');
      if (cardTitle) {
        addTitle(cardTitle.textContent);
      }

      const paragraphs = card.querySelectorAll('p');
      paragraphs.forEach(p => {
        let text = p.textContent.trim();
        if (text && !text.includes('undefined')) {
          addText(text, 11);
        }
      });

      const lists = card.querySelectorAll('ul li');
      lists.forEach(li => {
        addText('• ' + li.textContent.trim(), 11);
      });

      if (index < cards.length - 1) {
        yPosition += 5;
      }
    });

    // Se não houver cards, processar texto direto
    if (cards.length === 0) {
      const text = element.innerText || element.textContent || 'Sem conteúdo';
      addText(text, 11);
    }

    doc.save(filename);
  } catch (err) {
    console.error('Erro ao gerar PDF:', err);
    alert('Erro ao gerar PDF: ' + err.message);
  }
}

function exportObjectToExcel(objOrRows, filename = 'dados.xlsx', sheetName = 'Dados') {
  try {
    let ws;
    if (Array.isArray(objOrRows)) ws = XLSX.utils.aoa_to_sheet(objOrRows);
    else ws = XLSX.utils.aoa_to_sheet(Object.entries(objOrRows).map(([k,v]) => [k, v]));
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, sheetName); XLSX.writeFile(wb, filename);
  } catch (err) { alert('Erro ao gerar Excel: ' + err.message); console.error(err); }
}

document.addEventListener('DOMContentLoaded', () => {
  let currentUser = null;
  let usersDb = [];
  let assessmentsDb = {}; 
  let plansDb = {};      
  let chartInstances = {}; 

  const loadDb = () => {
    usersDb = JSON.parse(localStorage.getItem('dietaPopularUsers')) || [];
    assessmentsDb = JSON.parse(localStorage.getItem('dietaPopularAssessments')) || {};
    plansDb = JSON.parse(localStorage.getItem('dietaPopularPlans')) || {};
    if (usersDb.length === 0) {
      usersDb.push({ name: 'Admin', email: 'admin@email.com', birthdate: '1990-01-01', address: 'N/A', password: 'AdminNexa', role: 'admin', createdAt: new Date().toISOString() });
      usersDb.push({ name: 'Dr(a). Nutricionista', email: 'nutricionista@email.com', birthdate: '1992-05-10', address: 'N/A', password: 'NutriNexa', role: 'nutricionista', createdAt: new Date().toISOString() });
      saveUsersDb();
    }
  };
  const saveUsersDb = () => localStorage.setItem('dietaPopularUsers', JSON.stringify(usersDb));
  const saveAssessmentsDb = () => localStorage.setItem('dietaPopularAssessments', JSON.stringify(assessmentsDb));
  const savePlansDb = () => localStorage.setItem('dietaPopularPlans', JSON.stringify(plansDb));


  const screens = {
    login: 'login-screen', register: 'register-screen', main: 'main-panel',
    assessment: 'assessment-screen', results: 'results-screen',
    clientReport: 'client-report-screen', planEditor: 'plan-editor-screen'
  };
  const showScreen = (screenName) => {
    Object.values(screens).forEach(id => {
      const el = document.getElementById(id); if (el) el.classList.add('hidden');
    });
    const target = document.getElementById(screens[screenName]);
    if (target) target.classList.remove('hidden');
    window.scrollTo(0,0);
    
    // ADIÇÃO: Checa se deve travar a tela de avaliação
    if (screenName === 'assessment' && currentUser && currentUser.role === 'cliente') {
        checkAssessmentLock();
    }
  };


  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2,8);
  const calculateAge = (birthdateString) => {
    if (!birthdateString) return 'N/A';
    const birthDate = new Date(birthdateString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
  };

  function calculateRadarScores(formInputs) {
  const scores = {
    sono: 0,
    atividadeFisica: 0,
    alimentacao: 0,
    hidratacao: 0,
    saudeGeral: 0,
    bemEstar: 0
  };

  // 1. QUALIDADE DO SONO (0-100)
  let sleepScore = 0;
  switch(formInputs.sleep_hours) {
    case '7 a 8h': sleepScore += 50; break;
    case 'Mais de 8h': sleepScore += 40; break;
    case '5 a 6h': sleepScore += 25; break;
    case 'Menos de 5h': sleepScore += 10; break;
  }
  switch(formInputs.sleep_quality) {
    case 'Boa (revigorante)': sleepScore += 50; break;
    case 'Regular': sleepScore += 25; break;
    case 'Ruim (acordo cansado)': sleepScore += 10; break;
  }
  scores.sono = sleepScore;

  // 2. ATIVIDADE FÍSICA (0-100)
  let activityScore = 0;
  switch(formInputs.physical_activity_freq) {
    case '5 ou mais vezes/semana': activityScore += 50; break;
    case '3 a 4 vezes/semana': activityScore += 40; break;
    case '1 a 2 vezes/semana': activityScore += 20; break;
    case 'Sedentário': activityScore += 0; break;
  }
  switch(formInputs.physical_activity_type) {
    case 'Intensa (Crossfit, HIIT)': activityScore += 50; break;
    case 'Moderada (musculação, corrida leve)': activityScore += 40; break;
    case 'Leve (caminhada, yoga)': activityScore += 25; break;
    case 'Nenhuma': activityScore += 0; break;
  }
  scores.atividadeFisica = activityScore;

  // 3. ALIMENTAÇÃO SAUDÁVEL (0-100)
  let foodScore = 0;
  // Frutas e vegetais (positivo)
  switch(formInputs.fruits_vegetables) {
    case 'Diariamente, em boa quantidade': foodScore += 35; break;
    case 'Diariamente, em pouca quantidade': foodScore += 25; break;
    case '1 a 3 vezes/semana': foodScore += 15; break;
    case 'Nunca ou raramente': foodScore += 5; break;
  }
  // Processados (negativo)
  switch(formInputs.processed_food) {
    case 'Raramente ou nunca': foodScore += 35; break;
    case '1 a 2 vezes/semana': foodScore += 25; break;
    case '3 a 5 vezes/semana': foodScore += 10; break;
    case 'Diariamente': foodScore += 0; break;
  }
  // Doces (negativo)
  switch(formInputs.sweets) {
    case 'Raramente ou nunca': foodScore += 30; break;
    case '1 a 2 vezes/semana': foodScore += 20; break;
    case '3 a 5 vezes/semana': foodScore += 10; break;
    case 'Diariamente': foodScore += 0; break;
  }
  scores.alimentacao = foodScore;

  // 4. HIDRATAÇÃO (0-100)
  switch(formInputs.water_intake) {
    case '8 ou mais copos (2L+)': scores.hidratacao = 100; break;
    case '4 a 7 copos (1-1.5L)': scores.hidratacao = 65; break;
    case 'Menos de 4 copos': scores.hidratacao = 30; break;
  }

  // 5. SAÚDE GERAL (0-100)
  let healthScore = 100;
  // Reduz pontos por sintomas
  if (formInputs.symptoms) {
    const symptomCount = formInputs.symptoms.filter(s => s !== 'Nenhum').length;
    healthScore -= (symptomCount * 15);
  }
  // Reduz pontos por doenças
  if (formInputs.diseases) {
    const diseaseCount = formInputs.diseases.filter(d => d !== 'Nenhuma').length;
    healthScore -= (diseaseCount * 20);
  }
  scores.saudeGeral = Math.max(0, healthScore);

  // 6. BEM-ESTAR MENTAL (0-100)
  let mentalScore = 100;
  switch(formInputs.stress_level) {
    case 'Alto e constante': mentalScore = 30; break;
    case 'Moderado': mentalScore = 60; break;
    case 'Baixo': mentalScore = 95; break;
  }
  // Ajusta com base na qualidade do sono
  if (formInputs.sleep_quality === 'Ruim (acordo cansado)') {
    mentalScore -= 15;
  }
  scores.bemEstar = Math.max(0, mentalScore);

  return scores;
}

function createRadarChart(canvasId, scores) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  // Destruir gráfico anterior se existir
  if (chartInstances[canvasId]) {
    chartInstances[canvasId].destroy();
    delete chartInstances[canvasId];
  }

  chartInstances[canvasId] = new Chart(canvas.getContext('2d'), {
    type: 'radar',
    data: {
      labels: [
        'Qualidade do Sono',
        'Atividade Física',
        'Alimentação Saudável',
        'Hidratação',
        'Saúde Geral',
        'Bem-estar Mental'
      ],
      datasets: [{
        label: 'Seu Perfil Nutricional',
        data: [
          scores.sono,
          scores.atividadeFisica,
          scores.alimentacao,
          scores.hidratacao,
          scores.saudeGeral,
          scores.bemEstar
        ],
        backgroundColor: 'rgba(40, 167, 69, 0.2)',
        borderColor: 'rgba(40, 167, 69, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(40, 167, 69, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(40, 167, 69, 1)'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        r: {
          beginAtZero: true,
          max: 100,
          ticks: {
            stepSize: 20
          },
          pointLabels: {
            font: {
              size: 12
            }
          }
        }
      },
      plugins: {
        legend: {
          display: true,
          position: 'top'
        }
      }
    }
  });
}


function createRadarChart(canvasId, scores) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  // Destruir gráfico anterior se existir
  if (chartInstances[canvasId]) {
    chartInstances[canvasId].destroy();
    delete chartInstances[canvasId];
  }

  chartInstances[canvasId] = new Chart(canvas.getContext('2d'), {
    type: 'radar',
    data: {
      labels: [
        'Qualidade do Sono',
        'Atividade Física',
        'Alimentação Saudável',
        'Hidratação',
        'Saúde Geral',
        'Bem-estar Mental'
      ],
      datasets: [{
        label: 'Seu Perfil Nutricional',
        data: [
          scores.sono,
          scores.atividadeFisica,
          scores.alimentacao,
          scores.hidratacao,
          scores.saudeGeral,
          scores.bemEstar
        ],
        backgroundColor: 'rgba(40, 167, 69, 0.2)',
        borderColor: 'rgba(40, 167, 69, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(40, 167, 69, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(40, 167, 69, 1)'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        r: {
          beginAtZero: true,
          max: 100,
          ticks: {
            stepSize: 20
          },
          pointLabels: {
            font: {
              size: 12
            }
          }
        }
      },
      plugins: {
        legend: {
          display: true,
          position: 'top'
        }
      }
    }
  });
}


  const handleLogin = (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const pw = document.getElementById('login-password').value;
    const user = usersDb.find(u => u.email === email && u.password === pw);
    if (user) { currentUser = user; localStorage.setItem('currentUser', JSON.stringify(currentUser)); routeToPanel(); }
    else document.getElementById('login-error').textContent = 'Email ou senha inválidos.';
  };
  const handleRegister = (e) => {
    e.preventDefault();
    const email = document.getElementById('register-email').value.trim();
    if (usersDb.some(u => u.email === email)) { document.getElementById('register-error').textContent = 'Este email já está cadastrado.'; return; }
    const prefs = Array.from(document.querySelectorAll('#register-screen input[name="pref"]:checked')).map(i=>i.value);
    const newUser = {
      name: document.getElementById('register-name').value,
      email,
      birthdate: document.getElementById('register-birthdate').value,
      address: document.getElementById('register-address').value,
      password: document.getElementById('register-password').value,
      role: 'cliente',
      createdAt: new Date().toISOString(),
      preferences: prefs
    };
    usersDb.push(newUser); saveUsersDb();
    alert('Cadastro realizado com sucesso! Faça o login.');
    showScreen('login');
  };
  const handleLogout = () => { currentUser = null; localStorage.removeItem('currentUser'); location.reload(); };


  const routeToPanel = () => {
    
    document.getElementById('welcome-message').textContent = `Olá, ${currentUser.name.split(' ')[0]}!`;
    const panelContent = document.getElementById('panel-content');
    panelContent.innerHTML = '';
    switch (currentUser.role) {
      case 'admin': document.getElementById('panel-title').textContent = 'Painel de Administração'; renderAdminPanel(panelContent); break;
      case 'nutricionista': document.getElementById('panel-title').textContent = 'Painel do Nutricionista'; renderNutritionistPanel(panelContent); break;
      case 'cliente': document.getElementById('panel-title').textContent = 'Seu Painel Nutricional'; renderClientPanel(panelContent); break;
    }
    showScreen('main');
  };

  const renderAdminPanel = (container) => {
    container.innerHTML = `
      <div class="card"><h2>Painel de Administração</h2>
        <div style="display:flex;gap:8px;margin-top:8px;">
          <button id="admin-export-all-xlsx" class="btn-primary">Exportar Todos (Excel)</button>
          <button id="admin-export-all-pdf" class="btn-primary">Exportar Todos (PDF)</button>
        </div>
      </div>
      <div class="card"><h2>Usuários</h2><div id="admin-user-list-container"></div></div>
    `;
    const listCon = container.querySelector('#admin-user-list-container');
    const table = document.createElement('table'); table.className = 'user-table';
    table.innerHTML = `<thead><tr><th>Nome</th><th>Email</th><th>Perfil</th><th>Última Avaliação</th><th>Ações</th></tr></thead><tbody></tbody>`;
    const tbody = table.querySelector('tbody');
    usersDb.forEach(u => {
      const lastArr = (assessmentsDb[u.email] && assessmentsDb[u.email].length) ? assessmentsDb[u.email][assessmentsDb[u.email].length-1].date : '—';
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${u.name}</td><td>${u.email}</td><td>${u.role}</td><td>${ lastArr !== '—' ? new Date(lastArr).toLocaleDateString('pt-BR') : '—' }</td>
        <td>
          <button class="btn-view" data-email="${u.email}">Ver</button>
          <button class=" btn-export" data-email="${u.email}">Exportar</button>
          ${u.role!=='admin' ? `<button class="btn-danger btn-delete" data-email="${u.email}">Excluir</button>` : ''}
        </td>`;
      tbody.appendChild(tr);
    });
    listCon.appendChild(table);

    listCon.addEventListener('click', (e) => {
      const btn = e.target;
      if (btn.classList.contains('btn-delete')) {
        const email = btn.dataset.email;
        if (confirm(`Excluir usuário ${email}?`)) {
          usersDb = usersDb.filter(x => x.email !== email);
          delete assessmentsDb[email]; delete plansDb[Object.keys(plansDb).filter(k=>k.startsWith(email+'|'))];
          saveUsersDb(); saveAssessmentsDb(); savePlansDb(); routeToPanel();
        }
      } else if (btn.classList.contains('btn-view')) {
        const email = btn.dataset.email;
        const user = usersDb.find(u=>u.email===email);
        if (user) showClientReportScreen(user);
      } else if (btn.classList.contains('btn-export')) {
        const email = btn.dataset.email;
        const user = usersDb.find(u=>u.email===email);
        if (!user) return alert('Usuário não encontrado.');
        // export user data + all assessments + plans
        const rows = [['Campo','Valor']];
        rows.push(['Nome', user.name], ['Email', user.email], ['Nascimento', user.birthdate || ''], ['Endereço', user.address || '']);
        const arrs = assessmentsDb[email] || [];
        if (arrs.length) {
          rows.push([]); rows.push(['Avaliação - Data','IMC','Classificação','Observações/Alertas']);
          arrs.forEach(a => rows.push([new Date(a.date).toLocaleString('pt-BR'), a.imc, a.classification, (a.alerts && a.alerts.join('; ')) || '']));
        }
        exportObjectToExcel(rows, `${user.name.replace(/\s+/g,'_')}_dados.xlsx`);
      }
    });

    document.getElementById('admin-export-all-xlsx').onclick = () => {
      const header = ['Nome','Email','Perfil','Nascimento','Endereco','Última Avaliação'];
      const rows = [header];
      usersDb.forEach(u => rows.push([u.name||'', u.email||'', u.role||'', u.birthdate||'', u.address||'', (assessmentsDb[u.email] && assessmentsDb[u.email].length) ? new Date(assessmentsDb[u.email][assessmentsDb[u.email].length-1].date).toLocaleDateString('pt-BR') : '—']));
      exportObjectToExcel(rows, `usuarios_${new Date().toISOString().slice(0,10)}.xlsx`, 'Usuarios');
    };

    document.getElementById('admin-export-all-pdf').onclick = () => {
      const wrap = document.createElement('div'); wrap.style.padding='10px'; wrap.innerHTML = `<h2>Lista de Usuários</h2>`;
      const t = document.createElement('table'); t.style.width='100%';
      t.innerHTML = `<thead><tr><th>Nome</th><th>Email</th><th>Perfil</th></tr></thead>`;
      const tb = document.createElement('tbody');
      usersDb.forEach(u => { const r=document.createElement('tr'); r.innerHTML = `<td>${u.name}</td><td>${u.email}</td><td>${u.role}</td>`; tb.appendChild(r); });
      t.appendChild(tb); wrap.appendChild(t); document.body.appendChild(wrap);
      exportElementToPDF(wrap, `usuarios_${new Date().toISOString().slice(0,10)}.pdf`);
      document.body.removeChild(wrap);
    };
  };


  const renderNutritionistPanel = (container) => {
    container.innerHTML = `<div class="card"><h2>Clientes com Avaliações</h2><div id="nutri-client-list" class="client-list-clean"></div></div>`;
    const list = container.querySelector('#nutri-client-list');
    const clients = usersDb.filter(u => u.role==='cliente');
    if (clients.length === 0) { list.innerHTML = '<p>Nenhum cliente cadastrado.</p>'; return; }
    clients.forEach(c => {
      const lastAssessment = (assessmentsDb[c.email] && assessmentsDb[c.email].length) ? assessmentsDb[c.email][assessmentsDb[c.email].length-1] : null;
      const li = document.createElement('div'); li.className = 'list-item clickable';
      li.innerHTML = `<div class="list-item-info"><strong>${c.name} :</strong><span>${ lastAssessment ? new Date(lastAssessment.date).toLocaleDateString('pt-BR') : 'Nenhuma avaliação' }</span></div>
                      <div><button class="btn-primary btn-open-client" data-email="${c.email}">Ver avaliações</button></div>`;
      list.appendChild(li);
    });
    // delegate
    list.addEventListener('click', (e) => {
      if (e.target.classList.contains('btn-open-client')) {
        const email = e.target.dataset.email; const user = usersDb.find(u=>u.email===email);
        if (user) showClientReportScreen(user);
      }
    });
  };


  const renderClientPanel = (container) => {
    const arrs = assessmentsDb[currentUser.email] || [];
    const assessment = arrs.length ? arrs[arrs.length-1] : null;
    const planKey = assessment ? `${currentUser.email}|${assessment.id}` : null;
    const plan = planKey ? plansDb[planKey] : null;
    let content = '';
    if (assessment) {
      content += `<div class="card"><h3>Resumo da Última Avaliação</h3><p><strong>IMC:</strong> ${assessment.imc} (${assessment.classification})</p><p><strong>Data:</strong> ${new Date(assessment.date).toLocaleDateString('pt-BR')}</p><div style="margin-top:12px;" class="actions"><button id="view-full-results-btn" class="btn-primary">Ver Relatório Completo</button><button id="start-new-assessment-btn" class="btn-secondary">Fazer Nova Avaliação</button></div></div>`;
    } else {
      content += `<div class="card"><h2>Bem-vindo(a)!</h2><p>Comece sua avaliação nutricional para receber um plano alimentar personalizado.</p><button id="start-assessment-btn-welcome" class="btn-primary">Iniciar Avaliação Agora</button></div>`;
    }
    if (assessment) {
      content += `<div class="card"><h3>Seu Plano Alimentar</h3>`;
      if (plan) {
        content += `<div class="meal"><h3>Café da Manhã</h3><p>${plan.breakfast}</p></div>
                    ${plan.morningSnack ? `<div class="meal"><h3>Lanche da Manhã</h3><p>${plan.morningSnack}</p></div>` : ''}
                    <div class="meal"><h3>Almoço</h3><p>${plan.lunch}</p></div>
                    ${plan.afternoonSnack ? `<div class="meal"><h3>Lanche da Tarde</h3><p>${plan.afternoonSnack}</p></div>` : ''}
                    <div class="meal"><h3>Jantar</h3><p>${plan.dinner}</p></div>
                    ${plan.nightSnack ? `<div class="meal"><h3>Ceia</h3><p>${plan.nightSnack}</p></div>` : ''}
                    ${plan.extraMeals && plan.extraMeals.length ? plan.extraMeals.map((m,i)=>`<div class="meal"><h3>${m.title}</h3><p>${m.text}</p></div>`).join('') : ''}
                    ${plan.observations ? `<div class="meal"><h3>Observações</h3><p>${plan.observations}</p></div>` : ''}`;
      } else {
        content += `<p>Nenhum plano atribuído ainda. Aguarde seu nutricionista.</p>`;
      }
      content += `</div>`;
    }
    container.innerHTML = `<div class="dashboard-grid">${content}</div>`;
    if (document.getElementById('start-assessment-btn-welcome')) document.getElementById('start-assessment-btn-welcome').addEventListener('click', () => showScreen('assessment'));
    if (document.getElementById('start-new-assessment-btn')) document.getElementById('start-new-assessment-btn').addEventListener('click', () => showScreen('assessment'));
    view-full-results-btn
  };

  const checkAssessmentLock = () => {
    const arrs = assessmentsDb[currentUser.email] || [];
    const submitBtn = document.getElementById('assessment-submit-btn'); 
    const errorEl = document.getElementById('assessment-error');
//dias pra avalização
    if (arrs.length) {
        const lastDate = new Date(arrs[arrs.length-1].date);
        const diffDays = Math.floor((Date.now() - lastDate.getTime()) / (1000*60*60*24));

        if (diffDays < 0) {
            const remaining = 0 - diffDays;
            errorEl.textContent = `Você deve aguardar ${remaining} dia(s) antes de realizar nova avaliação.`;
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = `Nova Avaliação em ${remaining} dia(s)`;
            }
            return false;
        }
    }
    
    if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Enviar Avaliação';
    }
    if (errorEl) errorEl.textContent = '';
    return true;
  };

  const handleAssessmentSubmit = (e) => {
    e.preventDefault();

    const arrs = assessmentsDb[currentUser.email] || [];
    if (arrs.length) {
      const lastDate = new Date(arrs[arrs.length-1].date);
      const diffDays = Math.floor((Date.now() - lastDate.getTime()) / (1000*60*60*24));
      if (diffDays < 0) {
        const remaining = 0 - diffDays;
        document.getElementById('assessment-error').textContent = `Você deve aguardar ${remaining} dia(s) antes de realizar nova avaliação.`;
        return;
      }
    }
  

    const getCheckedValues = (name, scope=document) => Array.from(scope.querySelectorAll(`input[name="${name}"]:checked`)).map(el=>el.value);
    const form = {
      name_override: document.getElementById('assess-name').value.trim(),
      gender: document.getElementById('gender').value,
      weight: parseFloat(document.getElementById('weight').value),
      height: parseFloat(document.getElementById('height').value),
      waist_circ: document.getElementById('waist_circ').value,
      hip_circ: document.getElementById('hip_circ').value,
      sleep_hours: document.getElementById('sleep_hours').value,
      sleep_quality: document.getElementById('sleep_quality').value,
      stress_level: document.getElementById('stress_level').value,
      physical_activity_freq: document.getElementById('physical_activity_freq').value,
      physical_activity_type: document.getElementById('physical_activity_type').value,
      meals_per_day: document.getElementById('meals_per_day').value,
      eating_behavior: document.getElementById('eating_behavior').value,
      cravings: document.getElementById('cravings').value,
      water_intake: document.getElementById('water_intake').value,
      other_drinks: document.getElementById('other_drinks') ? document.getElementById('other_drinks').value : '',
      fruits_vegetables: document.getElementById('fruits_vegetables').value,
      processed_food: document.getElementById('processed_food').value,
      sweets: document.getElementById('sweets').value,
      symptoms: getCheckedValues('symptoms'),
      diseases: getCheckedValues('diseases'),
      family_history: document.getElementById('family_history').value,
      medications: document.getElementById('medications').value,
      income: document.getElementById('income').value,
      goal: document.getElementById('goal').value,
      diet_preferences: getCheckedValues('diet_pref'),
    };


    const imc = (form.weight / (form.height * form.height));
    const imcFixed = isFinite(imc) ? imc.toFixed(2) : 'N/A';
    let classification = '';
    if (isFinite(imc)) {
      if (imc < 18.5) classification = 'Abaixo do peso';
      else if (imc < 25) classification = 'Eutrofia (peso ideal)';
      else if (imc < 30) classification = 'Sobrepeso';
      else classification = 'Obesidade grau I';
    }
    const alerts = [];
    if (form.sleep_quality === 'Ruim (acordo cansado)') alerts.push('Qualidade do sono ruim pode impactar a saúde e o peso.');
    if (form.stress_level === 'Alto e constante') alerts.push('Estresse alto é um fator de risco.');
    if (form.physical_activity_freq === 'Sedentário') alerts.push('Sedentarismo é um risco à saúde.');
    if (form.processed_food === 'Diariamente' || form.sweets === 'Diariamente') alerts.push('Alto consumo de processados e açúcares.');
    if ((parseFloat(form.waist_circ) && form.gender === 'Feminino' && parseFloat(form.waist_circ) > 88) ||
        (parseFloat(form.waist_circ) && form.gender === 'Masculino' && parseFloat(form.waist_circ) > 102))
      alerts.push('Circunferência da cintura elevada (risco cardiovascular).');

    const profile = alerts.length > 2 ? 'Perfil com Pontos Críticos de Atenção' : alerts.length > 0 ? 'Perfil com Pontos de Melhoria' : 'Perfil Saudável';
    const assessmentObj = {
      id: uid(),
      date: new Date().toISOString(),
      imc: imcFixed,
      classification,
      alerts,
      profile,
      formInputs: form
    };

    if (!assessmentsDb[currentUser.email]) assessmentsDb[currentUser.email] = [];
    assessmentsDb[currentUser.email].push(assessmentObj);
    saveAssessmentsDb();
    alert('Avaliação enviada com sucesso!');
    routeToPanel();
  };


  const renderResultsContent = (assessment) => {
  // Calcular scores do radar
  const radarScores = calculateRadarScores(assessment.formInputs);
  
  return `
    <div class="card">
      <h2>IMC</h2>
      <p class="result-value">${assessment.imc}</p>
      <p class="result-classification">${assessment.classification}</p>
    </div>
    
    <div class="card">
      <h2>Seu Perfil Nutricional</h2>
      <canvas id="radar-chart-results" style="max-width:600px;height:400px;margin:20px auto;"></canvas>
    </div>
    
    <div class="card">
      <h2>Pontuações Detalhadas</h2>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:15px;margin-top:15px;">
        <div style="padding:15px;background:#f8f9fa;border-radius:8px;">
          <strong>Sono:</strong> ${radarScores.sono}/100
        </div>
        <div style="padding:15px;background:#f8f9fa;border-radius:8px;">
          <strong>Atividade Física:</strong> ${radarScores.atividadeFisica}/100
        </div>
        <div style="padding:15px;background:#f8f9fa;border-radius:8px;">
          <strong>Alimentação:</strong> ${radarScores.alimentacao}/100
        </div>
        <div style="padding:15px;background:#f8f9fa;border-radius:8px;">
          <strong>Hidratação:</strong> ${radarScores.hidratacao}/100
        </div>
        <div style="padding:15px;background:#f8f9fa;border-radius:8px;">
          <strong>Saúde Geral:</strong> ${radarScores.saudeGeral}/100
        </div>
        <div style="padding:15px;background:#f8f9fa;border-radius:8px;">
          <strong>Bem-estar:</strong> ${radarScores.bemEstar}/100
        </div>
      </div>
    </div>
    
    <div class="card">
      <h2>Alertas e Orientações</h2>
      <ul id="alerts-list">
        ${assessment.alerts.length ? assessment.alerts.map(a=>`<li>${a}</li>`).join('') : '<li>Nenhum alerta crítico gerado.</li>'}
      </ul>
    </div>
    
    <div class="card">
      <h2>Perfil</h2>
      <p>${assessment.profile}</p>
    </div>
  `;
};

  const showClientReportScreen = (client) => {
    const summaryEl = document.getElementById('client-summary');
    const listEl = document.getElementById('client-assessments-list');
    const detailEl = document.getElementById('client-assessment-detail');

    summaryEl.innerHTML = `<div class="card"><h2>Dados do Cliente</h2>
      <p><strong>Nome:</strong> ${client.name}</p>
      <p><strong>Email:</strong> ${client.email}</p>
      <p><strong>Idade:</strong> ${calculateAge(client.birthdate)} anos</p>
      <p><strong>Endereço:</strong> ${client.address || '—'}</p>
      <p><strong>Preferências:</strong> ${client.preferences && client.preferences.length ? client.preferences.join(', ') : '—'}</p>
      <p><strong>Cadastro:</strong> ${client.createdAt ? new Date(client.createdAt).toLocaleDateString('pt-BR') : '—'}</p>
    </div>`;

    // assessments list (as items)
    const arrs = assessmentsDb[client.email] || [];
    if (arrs.length === 0) {
      listEl.innerHTML = `<div class="card"><h3>Avaliações</h3><p>Este cliente ainda não realizou avaliações.</p></div>`;
      detailEl.innerHTML = `<div class="card"><p>Selecione uma avaliação para ver detalhes.</p></div>`;
    } else {
      listEl.innerHTML = `<div class="card"><h3>Avaliações (${arrs.length})</h3><div id="assess-list-inner"></div></div>`;
      const inner = document.getElementById('assess-list-inner');
      // show most recent first
      const sorted = [...arrs].sort((a,b)=>new Date(b.date)-new Date(a.date));
      sorted.forEach(a => {
        const item = document.createElement('div'); item.className = 'list-item clickable';
        item.innerHTML = `<div class="list-item-info"><strong>${new Date(a.date).toLocaleString('pt-BR')}</strong><span>IMC: ${a.imc} — ${a.classification}</span></div>`;
        inner.appendChild(item);
      });
      // attach click
      inner.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-open-assess')) {
          const assessId = e.target.dataset.id; const email = e.target.dataset.email;
          const assess = (assessmentsDb[email] || []).find(x=>x.id===assessId);
          if (assess) renderAssessmentDetail(client, assess);
        }
      });
      // show latest by default
      renderAssessmentDetail(client, sorted[0]);
    }

    // back button
    document.getElementById('client-report-back').onclick = () => routeToPanel();
    showScreen('clientReport');
  };

  /* ---------- render single assessment detail (with graphs + create plan) ---------- */
  const renderAssessmentDetail = (client, assessment) => {
    const detailEl = document.getElementById('client-assessment-detail');
    // detailed HTML content including all form inputs
    const f = assessment.formInputs;
    const prefs = f.diet_preferences && f.diet_preferences.length ? f.diet_preferences.join(', ') : '—';
    detailEl.innerHTML = `
      <div class="card">
        <h2>Avaliação - ${new Date(assessment.date).toLocaleString('pt-BR')}</h2>
        <p><strong>Nome (avaliação):</strong> ${f.name_override || client.name}</p>
        <p><strong>Email:</strong> ${client.email}</p>
        <p><strong>Idade:</strong> ${calculateAge(client.birthdate)} anos</p>
        <p><strong>Endereço:</strong> ${client.address || '—'}</p>
        <hr>
        <h3>Antropometria</h3>
        <p><strong>Peso:</strong> ${f.weight} kg | <strong>Altura:</strong> ${f.height} m | <strong>IMC:</strong> ${assessment.imc} (${assessment.classification})</p>
        <p><strong>Cintura:</strong> ${f.waist_circ || '—'} cm | <strong>Quadril:</strong> ${f.hip_circ || '—'} cm</p>
        <hr>
        <h3>Hábitos & Saúde</h3>
        <p><strong>Sono:</strong> ${f.sleep_hours} — ${f.sleep_quality}</p>
        <p><strong>Atividade:</strong> ${f.physical_activity_freq} — ${f.physical_activity_type}</p>
        <p><strong>Hidratação:</strong> ${f.water_intake} | <strong>Doces:</strong> ${f.sweets} | <strong>Processados:</strong> ${f.processed_food}</p>
        <p><strong>Sintomas:</strong> ${f.symptoms && f.symptoms.length ? f.symptoms.join(', ') : 'Nenhum'}</p>
        <p><strong>Doenças:</strong> ${f.diseases && f.diseases.length ? f.diseases.join(', ') : 'Nenhuma'}</p>
        <p><strong>Preferências:</strong> ${prefs}</p>
        <hr>
        <div id="client-assess-chart-container" style="padding:8px;">
          <h3>Evolução (últimos registros)</h3>
          <canvas id="client-evolution-chart" style="max-width:100%;height:300px;"></canvas>
        </div>
        <div style="display:flex;gap:8px;margin-top:12px;">
          <button id="btn-open-plan-for-assessment" class="btn-avaliation">Gerar Plano para ESTA Avaliação</button>
          <button id="btn-export-assess-xlsx" class="btn-avaliation">Exportar Avaliação (Excel)</button>
        </div>
        <div id="client-current-plan" style="margin-top:12px;"></div>
      </div>
    `;

    // render existing plan (if any) for this assessment
    const planKey = `${client.email}|${assessment.id}`;
    const plan = plansDb[planKey];
    if (plan) {
      const planDiv = document.getElementById('client-current-plan');
      planDiv.innerHTML = `<div class="card"><h3>Plano vinculado a esta avaliação</h3>
        <p><strong>Café:</strong> ${plan.breakfast}</p>
        ${plan.morningSnack ? `<p><strong>Lanche manhã:</strong> ${plan.morningSnack}</p>` : ''}
        <p><strong>Almoço:</strong> ${plan.lunch}</p>
        ${plan.afternoonSnack ? `<p><strong>Lanche tarde:</strong> ${plan.afternoonSnack}</p>` : ''}
        <p><strong>Jantar:</strong> ${plan.dinner}</p>
        ${plan.nightSnack ? `<p><strong>Ceia:</strong> ${plan.nightSnack}</p>` : ''}
        ${plan.extraMeals && plan.extraMeals.length ? plan.extraMeals.map(m=>`<p><strong>${m.title}:</strong> ${m.text}</p>`).join('') : ''}
        ${plan.observations ? `<p><strong>Observações:</strong> ${plan.observations}</p>` : ''}
        <div style="margin-top:8px;"><button id="btn-open-plan-editor-existing" class="btn-secondary">Editar Plano</button>
        <button id="btn-export-plan-xlsx" class="btn-avaliation">Exportar Plano (Excel)</button>
        <button id="btn-export-plan-pdf" class="btn-avaliation">Exportar Plano (PDF)</button></div></div>`;
      // attach export/edit handlers after DOM insertion
      document.getElementById('btn-open-plan-editor-existing').onclick = () => openPlanEditorFor(client.email, assessment.id);
      document.getElementById('btn-export-plan-xlsx').onclick = () => {
        exportPlanToExcel(planKey, `${client.name.replace(/\s+/g,'_')}_plano_${assessment.date.slice(0,10)}.xlsx`);
      };
      document.getElementById('btn-export-plan-pdf').onclick = () => {
        const wrap = document.createElement('div'); wrap.style.padding='20px'; wrap.innerHTML = `
        <h2>Plano - ${client.name}</h2>`;
        wrap.innerHTML += `
        <p><strong>Café:</strong> ${plan.breakfast}</p>
        <p><strong>Almoço:</strong> ${plan.lunch}</p>
        <p><strong>Jantar:</strong> ${plan.dinner}</p>`;
        document.body.appendChild(wrap); exportElementToPDF(wrap, `${client.name.replace(/\s+/g,'_')}_plano_${assessment.date.slice(0,10)}.pdf`); document.body.removeChild(wrap);
      };
    }


const radarScores = calculateRadarScores(assessment.formInputs);
const radarContainer = document.createElement('div');
radarContainer.className = 'card';
radarContainer.style.marginTop = '20px';
radarContainer.innerHTML = `
  <h3>Perfil Nutricional do Cliente</h3>
  <canvas id="radar-chart-client-detail" style="max-width:600px;height:400px;margin:20px auto;"></canvas>
`;
detailEl.querySelector('.card').appendChild(radarContainer);

setTimeout(() => {
  createRadarChart('radar-chart-client-detail', radarScores);
}, 100);

    // btn open plan
    document.getElementById('btn-open-plan-for-assessment').onclick = () => openPlanEditorFor(client.email, assessment.id);

    // export assessment to excel
    document.getElementById('btn-export-assess-xlsx').onclick = () => {
      const rows = [['Campo','Valor']];
      Object.entries(assessment.formInputs).forEach(([k,v]) => rows.push([k, Array.isArray(v) ? v.join(', ') : v]));
      rows.push([]); rows.push(['IMC', assessment.imc]); rows.push(['Classificação', assessment.classification]); rows.push(['Alertas', assessment.alerts.join('; ')]);
      exportObjectToExcel(rows, `${client.name.replace(/\s+/g,'_')}_avaliacao_${assessment.date.slice(0,10)}.xlsx`);
    };

    // draw evolution chart (peso + imc + optionally others) using last 21 days (or last N assessments)
    renderChartForAssessmentSeries(client.email, assessment.id, 'client-evolution-chart');
  };

  /* ---------- chart: for assessment series (client evolution) ---------- */
  function renderChartForAssessmentSeries(email, assessmentId, canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    // gather assessments for this user, sort chronologically ascending
    const arrs = (assessmentsDb[email] || []).slice().sort((a,b)=>new Date(a.date)-new Date(b.date));
    // consider last 21 days: include all assessments but plot full series; if many, just last 21 entries
    const labels = arrs.map(a => new Date(a.date).toLocaleDateString('pt-BR'));
    const weights = arrs.map(a => parseFloat(a.formInputs.weight) || null);
    const imcs = arrs.map(a => parseFloat(a.imc) || null);
    // optionally: other measures (waist)
    const waists = arrs.map(a => parseFloat(a.formInputs.waist_circ) || null);

    // cleanup previous chart
    if (chartInstances[canvasId]) { chartInstances[canvasId].destroy(); delete chartInstances[canvasId]; }

    chartInstances[canvasId] = new Chart(canvas.getContext('2d'), {
      type: 'line',
      data: {
        labels,
        datasets: [
          { label: 'Peso (kg)', data: weights, tension:0.3, fill:false },
          { label: 'IMC', data: imcs, tension:0.3, fill:false },
          { label: 'Cintura (cm)', data: waists, tension:0.3, fill:false }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: { y: { beginAtZero: false } }
      }
    });
  }

  /* ---------- simplified helper to show evolution chart for client (used in results-screen) ---------- */
  function renderChartForClient(email) {
    const canvas = document.getElementById('profileChart') || (() => {
      // create canvas inside results-content if not present
      const cont = document.getElementById('results-content');
      const wrapper = document.createElement('div'); wrapper.innerHTML = `<div class="card"><h3>Evolução</h3><canvas id="profileChart" style="height:300px;"></canvas></div>`;
      cont.appendChild(wrapper);
      return document.getElementById('profileChart');
    })();
    if (!canvas) return;
    // reuse series function
    const arrs = (assessmentsDb[email] || []).slice().sort((a,b)=>new Date(a.date)-new Date(b.date));
    const labels = arrs.map(a => new Date(a.date).toLocaleDateString('pt-BR'));
    const weights = arrs.map(a => parseFloat(a.formInputs.weight) || null);
    const imcs = arrs.map(a => parseFloat(a.imc) || null);
    if (chartInstances['profileChart']) { chartInstances['profileChart'].destroy(); delete chartInstances['profileChart']; }
    chartInstances['profileChart'] = new Chart(canvas.getContext('2d'), {
      type: 'line',
      data: { labels, datasets: [{ label:'Peso (kg)', data: weights, tension:0.3 }, { label:'IMC', data: imcs, tension:0.3 }] },
      options: { responsive:true, maintainAspectRatio:false }
    });
  }

  /* ---------- plano: abrir editor vinculado a email+assessmentId ---------- */
  const openPlanEditorFor = (email, assessmentId) => {
    document.getElementById('plan-for-email').value = email;
    document.getElementById('plan-for-assessment-date').value = assessmentId;
    const planKey = `${email}|${assessmentId}`;
    const plan = plansDb[planKey] || {};
    document.getElementById('plan-breakfast').value = plan.breakfast || '';
    document.getElementById('plan-morning-snack').value = plan.morningSnack || '';
    document.getElementById('plan-lunch').value = plan.lunch || '';
    document.getElementById('plan-afternoon-snack').value = plan.afternoonSnack || '';
    document.getElementById('plan-dinner').value = plan.dinner || '';
    document.getElementById('plan-night-snack').value = plan.nightSnack || '';
    document.getElementById('plan-observations').value = plan.observations || '';
    // render extra meals
    const extraContainer = document.getElementById('extra-meals-container');
    extraContainer.innerHTML = '';
    (plan.extraMeals || []).forEach((m, idx) => {
      const el = document.createElement('div');
      el.className = 'input-plan';
      el.innerHTML = `<label style:"margin-bottom: 10px;">Ref: <input class="extra-title" data-idx="${idx}" value="${m.title}"></label>
                      <textarea class="extra-text" data-idx="${idx}" rows="2">${m.text}</textarea>
                      <button type="button" class="btn-danger btn-remove-extra" data-idx="${idx}">Remover</button>`;
      extraContainer.appendChild(el);
    });

    // add extra meal handler
    document.getElementById('add-extra-meal').onclick = () => {
      const idx = extraContainer.children.length;
      const el = document.createElement('div');
      el.className = 'input-plan';
      el.innerHTML = `<label>Refeição extra:</label><br><input  style="margin-bottom:20px;  class="extra-title" data-idx="${idx}" placeholder="Título (ex: Pré-treino)"><textarea class="extra-text" data-idx="${idx}" rows="2" placeholder="Descrição / opções"></textarea><button type="button" class="btn-danger btn-remove-extra" data-idx="${idx}">Remover</button>`;
      extraContainer.appendChild(el);
      // attach remove on the new node
      el.querySelector('.btn-remove-extra').onclick = (ev) => { ev.target.parentElement.remove(); };
    };
    // attach existing remove buttons
    extraContainer.querySelectorAll('.btn-remove-extra').forEach(b => b.onclick = (ev)=>ev.target.parentElement.remove());

    // back button returns to clientReport (opens client details again)
    document.getElementById('plan-editor-back').onclick = () => {
      const email = document.getElementById('plan-for-email').value;
      const client = usersDb.find(u=>u.email===email);
      if (client) showClientReportScreen(client); else routeToPanel();
    };

    // exports (for plan only)
    document.getElementById('plan-export-xlsx').onclick = () => {
      const pk = `${document.getElementById('plan-for-email').value}|${document.getElementById('plan-for-assessment-date').value}`;
      exportPlanToExcel(pk, `plano_${pk.replace('|','_')}.xlsx`);
    };
    document.getElementById('plan-export-pdf').onclick = () => {
      // create element with plan content to export
      const pk = `${document.getElementById('plan-for-email').value}|${document.getElementById('plan-for-assessment-date').value}`;
      const plan = plansDb[pk] || {};
      const wrap = document.createElement('div'); wrap.style.padding='10px';
      wrap.innerHTML = `<h2>Plano - ${pk}</h2><p><strong>Café:</strong> ${plan.breakfast || ''}</p><p><strong>Almoço:</strong> ${plan.lunch || ''}</p><p><strong>Jantar:</strong> ${plan.dinner || ''}</p>`;
      if (plan.extraMeals && plan.extraMeals.length) plan.extraMeals.forEach(m=> wrap.innerHTML += `<p><strong>${m.title}</strong>: ${m.text}</p>`);
      if (plan.observations) wrap.innerHTML += `<p><strong>Observações:</strong> ${plan.observations}</p>`;
      document.body.appendChild(wrap); exportElementToPDF(wrap, `plano_${pk.replace('|','_')}.pdf`); document.body.removeChild(wrap);
    };

    // submit salvar plano (essenciais obrigatórios)
    document.getElementById('plan-editor-form').onsubmit = (ev) => {
      ev.preventDefault();
      const email = document.getElementById('plan-for-email').value;
      const assessmentId = document.getElementById('plan-for-assessment-date').value;
      const breakfast = document.getElementById('plan-breakfast').value.trim();
      const lunch = document.getElementById('plan-lunch').value.trim();
      const dinner = document.getElementById('plan-dinner').value.trim();
      if (!breakfast || !lunch || !dinner) return alert('Preencha as refeições essenciais: Café da Manhã, Almoço e Jantar.');
      // collect extra meals
      const extras = [];
      document.querySelectorAll('#extra-meals-container .input-group').forEach((node, idx) => {
        const titleEl = node.querySelector('.extra-title');
        const textEl = node.querySelector('.extra-text');
        const title = titleEl ? (titleEl.value || titleEl.textContent || `Extra ${idx+1}`) : `Extra ${idx+1}`;
        const text = textEl ? textEl.value : '';
        if (title || text) extras.push({ title, text });
      });
      const planObj = {
        breakfast, morningSnack: document.getElementById('plan-morning-snack').value.trim(),
        lunch, afternoonSnack: document.getElementById('plan-afternoon-snack').value.trim(),
        dinner, nightSnack: document.getElementById('plan-night-snack').value.trim(),
        extraMeals: extras,
        observations: document.getElementById('plan-observations').value.trim(),
        savedAt: new Date().toISOString()
      };
      const planKey = `${email}|${assessmentId}`;
      plansDb[planKey] = planObj; savePlansDb();
      alert('Plano salvo com sucesso!');
      // go back to client assessment detail
      const client = usersDb.find(u=>u.email===email);
      if (client) showClientReportScreen(client);
      else routeToPanel();
    };

    showScreen('planEditor');
  };

  function exportPlanToExcel(planKey, filename) {
    const plan = plansDb[planKey];
    if (!plan) return alert('Nenhum plano encontrado para exportação.');
    const rows = [['Refeição','Descrição']];
    rows.push(['Café da Manhã', plan.breakfast || '']);
    rows.push(['Lanche manhã', plan.morningSnack || '']);
    rows.push(['Almoço', plan.lunch || '']);
    rows.push(['Lanche tarde', plan.afternoonSnack || '']);
    rows.push(['Jantar', plan.dinner || '']);
    rows.push(['Ceia', plan.nightSnack || '']);
    (plan.extraMeals || []).forEach(m => rows.push([m.title, m.text]));
    rows.push([]); rows.push(['Observações', plan.observations || '']);
    exportObjectToExcel(rows, filename || 'plano.xlsx');
  }

  const init = () => {
    loadDb();
    const loginForm = document.getElementById('login-form'); if (loginForm) loginForm.addEventListener('submit', handleLogin);
    const loginBtn = document.getElementById('login-btn'); // NOVO: Seleciona o botão
    if (loginBtn) loginBtn.addEventListener('click', handleLogin);
    const registerForm = document.getElementById('register-form'); if (registerForm) registerForm.addEventListener('submit', handleRegister);
    const logoutBtn = document.getElementById('logout-btn'); if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
    const assessmentForm = document.getElementById('assessment-form'); if (assessmentForm) assessmentForm.addEventListener('submit', handleAssessmentSubmit);
    document.getElementById('show-register').addEventListener('click', (e)=>{ e.preventDefault(); showScreen('register'); });
    document.getElementById('show-login').addEventListener('click', (e)=>{ e.preventDefault(); showScreen('login'); });
    document.querySelectorAll('.back-to-home-btn').forEach(btn=>btn.addEventListener('click', routeToPanel));

    const storedUser = localStorage.getItem('currentUser'); if (storedUser) { currentUser = JSON.parse(storedUser); routeToPanel(); } else { showScreen('login'); }

    // small safety: clear assessment-error on input
    const assessmentFormEl = document.getElementById('assessment-form');
    if (assessmentFormEl) assessmentFormEl.addEventListener('input', ()=>{ const el = document.getElementById('assessment-error'); if (el) el.textContent=''; });
    
    const openTermsLink = document.getElementById('open_term_link'); // Confirme que o ID está certo
    const modalOverlay = document.getElementById('modal-overlay');
    const modalCloseBtn = document.getElementById('modal-close-btn');

    if (openTermsLink && modalOverlay) {
      openTermsLink.addEventListener('click', (e) => {
        e.preventDefault(); // Impede o link de pular a página
        modalOverlay.classList.add('show');
      });
    }

    if (modalCloseBtn && modalOverlay) {
      modalCloseBtn.addEventListener('click', () => {
        modalOverlay.classList.remove('show');
      });
    }

    if (modalOverlay) {
      modalOverlay.addEventListener('click', (e) => {
        // Fecha o modal apenas se o clique for no fundo (overlay)
        if (e.target === modalOverlay) {
          modalOverlay.classList.remove('show');
        }
      });
    }
    // --- Fim da ló

  };

  init();
});