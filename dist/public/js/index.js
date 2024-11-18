const UPDATE_MESS = {
    SUCCESS: 'Cập nhật thành công',
    FAILURE: 'Cập nhật thất bại',
};

const createElementToast = (props) => {
    const toastBG = props.type === 'success' ? 'text-bg-success' : 'text-bg-danger';
    const html = `
        <div class="toast-container position-fixed top-0 end-0 p-2">
            <div id="${props.id || 'toastEx'}" class="toast ${toastBG}" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="toast-header ${toastBG}">
                    <strong class="me-auto">Thông báo</strong>
                    <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
                <div class="toast-body">
                    ${props.text || ''}
                </div>
            </div>
        </div>
    `;

    const elm = document.getElementById('jsAppend');
    elm && (elm.innerHTML = html);
};

const showToast = (props) => {
    const { type = 'success', text = '' } = props;
    const toastId = 'toastMess';
    createElementToast({
        id: toastId,
        type,
        text: text || '',
    });

    const toastElm = document.getElementById(toastId);
    if (toastElm) {
        const toastBootstrap = bootstrap.Toast.getOrCreateInstance(toastElm);
        toastBootstrap.show();
    }
};

const getFormData = (frmId) => {
    const refFrm = document.getElementById(frmId);
    if (!refFrm) return {};

    const elms = refFrm?.getElementsByClassName('get-data');
    if (!elms.length) return {};

    const data = (() => {
        const _data = {};
        for (const el of elms) {
            const name = el.getAttribute('name');
            const value = el.value || '';
            name && (_data[name] = value);
        }
        return _data;
    })();

    return data;
};

const saveCandidate = () => {
    const data = getFormData('refFormCandidate');
    if (!Object.keys(data).length) {
        return;
    }
    axios
        .post('/candidate', data)
        .then(function (response) {
            const document = response.data._doc;
            showToast({ type: 'success', text: UPDATE_MESS.SUCCESS });
        })
        .catch(function (error) {
            const {
                response: {
                    data: { errors = [] },
                },
            } = error;

            const showErrors = [];
            for (const err of errors) {
                showErrors.push(`<li>${err}</li>`);
            }

            showToast({
                type: 'danger',
                text: `<p class="mb-1">${UPDATE_MESS.FAILURE}</p><ul class="list m-0">${showErrors.join('')}</ul>`,
            });
        });
};
