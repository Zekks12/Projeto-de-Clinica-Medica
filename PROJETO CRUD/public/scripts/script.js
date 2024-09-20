document.addEventListener('DOMContentLoaded', function () {
    const patients = JSON.parse(localStorage.getItem('patients')) || [];
    const patientsTable = document.querySelector('#patients-table tbody');
    const patientForm = document.getElementById('patient-form');
    const updateForm = document.getElementById('update-form');
    const messageDiv = document.getElementById('message'); <
    link rel = "stylesheet"
    href = "style.css" > < /link>

    function savePatients() {
        localStorage.setItem('patients', JSON.stringify(patients));
    }

    function displayMessage(message, isError = false) {
        messageDiv.textContent = message;
        messageDiv.className = isError ? 'error' : 'success';
        setTimeout(() => {
            messageDiv.textContent = '';
            messageDiv.className = '';
        }, 3000);
    }

    function validateCPF(cpf) {
        cpf = cpf.replace(/[^\d]+/g, '');
        if (cpf.length !== 11 || !/^\d{11}$/.test(cpf)) return false;

        // Validação do dígito verificador
        let sum = 0;
        let remainder;
        for (let i = 1; i <= 9; i++) {
            sum += parseInt(cpf.substring(i - 1, i)) * (11 - i);
        }
        remainder = (sum * 10) % 11;
        if ((remainder === 10) || (remainder === 11)) remainder = 0;
        if (remainder !== parseInt(cpf.substring(9, 10))) return false;

        sum = 0;
        for (let i = 1; i <= 10; i++) {
            sum += parseInt(cpf.substring(i - 1, i)) * (12 - i);
        }
        remainder = (sum * 10) % 11;
        if ((remainder === 10) || (remainder === 11)) remainder = 0;
        if (remainder !== parseInt(cpf.substring(10, 11))) return false;

        return true;
    }

    function formatCPF(cpf) {
        return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    }

    function listPatients() {
        if (!patientsTable) return;
        patientsTable.innerHTML = '';
        if (patients.length === 0) {
            const row = patientsTable.insertRow();
            const cell = row.insertCell(0);
            cell.colSpan = 6;
            cell.textContent = 'Nenhum paciente registrado.';
        } else {
            patients.forEach(patient => {
                const row = patientsTable.insertRow();
                row.insertCell(0).textContent = formatCPF(patient.cpf);
                row.insertCell(1).textContent = patient.name;
                row.insertCell(2).textContent = patient.age;
                row.insertCell(3).textContent = patient.date;
                row.insertCell(4).textContent = patient.time;
                const actionsCell = row.insertCell(5);

                const updateButton = document.createElement('a');
                updateButton.textContent = 'Atualizar';
                updateButton.href = `atualizar.html?cpf=${patient.cpf}`;
                updateButton.className = 'btn btn-update';
                actionsCell.appendChild(updateButton);

                const deleteButton = document.createElement('button');
                deleteButton.textContent = 'Deletar';
                deleteButton.className = 'btn btn-delete';
                deleteButton.onclick = () => deletePatient(patient.cpf);
                actionsCell.appendChild(deleteButton);
            });
        }
    }

    function deletePatient(cpf) {
        if (confirm('Tem certeza que deseja deletar este paciente?')) {
            const index = patients.findIndex(p => p.cpf === cpf);
            if (index !== -1) {
                patients.splice(index, 1);
                savePatients();
                listPatients();
                displayMessage('Paciente deletado com sucesso!');
            }
        }
    }

    function handleFormSubmit(e) {
        e.preventDefault();
        const cpf = document.getElementById('cpf').value.replace(/[^\d]+/g, '');
        const name = document.getElementById('nome').value.trim();
        const age = document.getElementById('idade').value.trim();
        const date = document.getElementById('dia_marcado').value.trim();
        const time = document.getElementById('hora_marcada').value.trim();

        if (!validateCPF(cpf)) {
            displayMessage('CPF inválido.', true);
            return;
        }

        const patientExists = patients.some(patient => patient.cpf === cpf);
        if (patientExists) {
            displayMessage('Paciente já cadastrado.', true);
            return;
        }

        const newPatient = {
            cpf,
            name,
            age,
            date,
            time
        };
        patients.push(newPatient);
        savePatients();
        displayMessage('Paciente inserido com sucesso!');
        patientForm.reset();
    }

    if (patientForm) {
        patientForm.addEventListener('submit', handleFormSubmit);
    }

    if (patientsTable) {
        listPatients();
    }

    if (updateForm) {
        const urlParams = new URLSearchParams(window.location.search);
        const cpf = urlParams.get('cpf');
        const patient = patients.find(p => p.cpf === cpf);
        if (!patient) {
            displayMessage('Paciente não encontrado.', true);
            return;
        }
        document.getElementById('cpf').value = formatCPF(patient.cpf);
        document.getElementById('nome').value = patient.name;
        document.getElementById('idade').value = patient.age;
        document.getElementById('dia_marcado').value = patient.date;
        document.getElementById('hora_marcada').value = patient.time;

        updateForm.addEventListener('submit', (e) => {
            e.preventDefault();
            patient.name = document.getElementById('nome').value.trim();
            patient.age = document.getElementById('idade').value.trim();
            patient.date = document.getElementById('dia_marcado').value.trim();
            patient.time = document.getElementById('hora_marcada').value.trim();
            savePatients();
            displayMessage('Dados atualizados com sucesso!');
        });
    }
});