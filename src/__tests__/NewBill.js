import { screen, fireEvent} from "@testing-library/dom"
import userEvent from '@testing-library/user-event'
import { localStorageMock } from "../__mocks__/localStorage.js";
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import BillsUI from "../views/BillsUI.js";
import firestore from "../app/Firestore";
import firebase from "../__mocks__/firebase";
import { ROUTES, ROUTES_PATH } from "../constants/routes";

describe("Given I am connected as an employee", () => {

  describe("When I am on NewBill Page", () => {
    test("Then it should render NewBill page", () => {
      const html = NewBillUI()
      //inject "Envoyer une note de frais" form html in dom
      document.body.innerHTML = html
      const newBillForm = screen.getByTestId('form-new-bill')
      // newbillform should be render in dom
      expect(newBillForm).toBeTruthy()
    })

    describe("When I upload a file with the wrong format", () => {
      test("Then the bill shouldn't be created", () => {
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname })
        }
        Object.defineProperty(window, "localStorage", {
          value: localStorageMock,
        })
        // sets employee user
        window.localStorage.setItem(
          "user",
          JSON.stringify({
            type: "Employee",
          })
        )
        const firestore = null
        const html = NewBillUI()
        document.body.innerHTML = html
  
        const newBill = new NewBill({
          document,
          onNavigate,
          firestore,
          localStorage: window.localStorage,
        })
        const handleSubmit = jest.fn(newBill.handleSubmit)
        newBill.fileName = "invalid"
        const submitBtn = screen.getByTestId("form-new-bill")
        submitBtn.addEventListener("submit", handleSubmit)
        fireEvent.submit(submitBtn)
        expect(handleSubmit).toHaveBeenCalled()
      })

      test('Then the error message should be display', async () => {
        // Build user interface
        const html = NewBillUI();
        document.body.innerHTML = html;

        // Init newBill
        const newBill = new NewBill({
            document,
        });

        // Mock of handleChangeFile
        const handleChangeFile = jest.fn(() => newBill.handleChangeFile);

        // Add Event and fire
        const inputFile = screen.getByTestId('file');
        inputFile.addEventListener('change', handleChangeFile);
        fireEvent.change(inputFile, {
            target: {
                files: [new File(['bill.pdf'], 'bill.pdf', {
                    type: 'image/pdf'
                })],
            }
        });

        // handleChangeFile function must be called
        expect(handleChangeFile).toBeCalled();
        // The name of the file should be 'bill.pdf'
        expect(inputFile.files[0].name).toBe('bill.pdf');
        // expect error data to be true
        expect(document.querySelector(`input[data-testid="file"]`).getAttribute("data-error")).toBe("true")
      });
    })

    describe('When I upload a correct format file (png, jpeg or jpg)', () => {
      test('Then the name of the file should be present in the input file', () => {
        document.body.innerHTML = NewBillUI()
        const inputFile = screen.getByTestId('file')
        const inputData = {
            file: new File(['test'], 'test.png', {
                type: 'image/png',
            }),
        }
        const newBill = new NewBill({
            document,
        })
        userEvent.upload(inputFile, inputData.file)
        expect(inputFile.files[0]).toStrictEqual(inputData.file)
        // expect error data to be true
        expect(document.querySelector(`input[data-testid="file"]`).getAttribute("data-error")).toBe("true")
      })
    })
  })
})

// test d'intégration POST
describe("Given I am a user connected as Employee", () => {
	describe("When I create a new bill", () => {
	  test("add bill to mock API POST", async () => {
      //creates a newbill object
		const newBill = {
		  id: "hotelfacture20211121employee100",
		  vat: "20",
      "fileUrl": "https://firebasestorage.googleapis.com/v0/b/billable-677b6.a…61.jpeg?alt=media&token=7685cd61-c112-42bc-9929-8a799bb82d8b",
		  status: "pending",
		  type: "Hôtel",
		  commentary: "facture hotel séminaire novembre",
		  name: "POST",
		  fileName: "preview-facture-hotel-2021121-pdf-1.jpg",
		  date: "2021-11-21",
		  amount: 100,
		  commentAdmin: "sans commentaire",
		  email: "a@a",
		  pct: 20,
		}
		const postSpy = jest.spyOn(firebase, "post")
		const bills = await firebase.post(newBill)
    console.log(bills)
		expect(postSpy).toHaveBeenCalledTimes(1)
		expect(bills.data.length).toBe(5)
	  });
	  test("add bill to API and fails with 404 message error", async () => {
      firebase.post.mockImplementationOnce(() => 
        Promise.reject(new Error("Erreur 404")))
      // build up bill page with error 404
      const html = BillsUI({ error: "Erreur 404" })
      document.body.innerHTML = html;
      // waits for the error message to be caught
      const message = await screen.getByText(/Erreur 404/)
      expect(message).toBeTruthy();
	  })
	  test("add bill to API and fails with 500 message error", async () => {
      firebase.post.mockImplementationOnce(() => Promise.reject(new Error("Erreur 500")))
      const html = BillsUI({ error: "Erreur 500" })
      document.body.innerHTML = html
      const message = await screen.getByText(/Erreur 500/)
      expect(message).toBeTruthy()
	  });
	});
})